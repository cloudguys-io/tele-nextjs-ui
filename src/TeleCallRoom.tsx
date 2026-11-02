"use client";
// <TeleCallRoom>: <TeleCall> from @tele/call-ui/react, wired for the Next.js App Router. Every prop can come
// from a server component (URLs and strings), and leaving navigates with the router by default.
import { useCallback, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
// "next" has no exports map, so plain Node ESM needs the file name; Next.js resolves both the same way.
import { useRouter } from "next/navigation.js";
import { TeleCall } from "@tele/call-ui/react";
import type { TeleApiError } from "./errors.js";
import { createChatHistoryLoader, createDiagnosticsReporter, createEndForAll, createRecordingToggle } from "./fetchers.js";
import type { InviteStrings } from "./messages.js";
import { resolveTheme, type ThemeProp } from "./theme.js";
import type {
  Feature,
  HistoryMessage,
  JoinResponse,
  Layout,
  ReportDiagnostic,
  Strings,
  TeleCallElement,
  TeleChatDetail,
  TeleErrorDetail,
  TeleJoinedDetail,
  TeleLeaveDetail,
  TeleParticipantDetail,
} from "./types.js";
import { useTeleJoin } from "./useTeleJoin.js";

type Phase = "lobby" | "joining" | "live" | "ended" | "error" | "left";

/** What a ref to `<TeleCallRoom>` gives you. */
export type TeleCallRoomHandle = {
  /** Disconnect; fires `onLeave` with reason `left`. */
  leave(): Promise<void>;
  setMicrophone(on: boolean): Promise<void>;
  setCamera(on: boolean): Promise<void>;
  /** `lobby`, `joining`, `live`, `ended`, `error` or `left`. */
  readonly phase: Phase;
  /** The `<tele-call>` element, once mounted. */
  readonly element: TeleCallElement | null;
};

export type TeleCallRoomProps = {
  /** Your backend's join endpoint (POST). It returns Tele's join response or error body unchanged. */
  joinUrl?: string;
  /** Extra fetch options for joinUrl and the endpoint URLs below, such as headers. */
  fetchInit?: RequestInit;
  /** Your own join function instead of `joinUrl`. */
  getJoin?: () => Promise<JoinResponse>;

  /** `lobby chat screenshare devices recording-indicator` (array or space-separated). Default: all. */
  features?: Feature[] | string;
  /** `en` or `bn`. Default `en`. */
  lang?: string;
  /** `light`, `dark`, `auto`, or an object of `--tele-*` values plus `mode`. */
  theme?: ThemeProp;
  /** `grid` or `speaker`. Default `grid`. */
  layout?: Layout;
  /** Label overrides for the call screen. */
  strings?: Partial<Strings>;
  /** Overrides for the friendly join-error texts. */
  errorStrings?: Partial<InviteStrings>;
  /** Replace Tele's error messages with friendly text in `lang`. Default true. */
  friendlyErrors?: boolean;

  /** GET endpoint for saved chat (`GET /v1/calls/{id}/messages`). `{callId}` is filled in. */
  chatHistoryUrl?: string;
  loadChatHistory?: (callId: string) => Promise<HistoryMessage[]>;
  /** POST endpoint for diagnostics (`POST /v1/calls/{id}/diagnostics`). `{callId}` is filled in. */
  diagnosticsUrl?: string;
  reportDiagnostic?: ReportDiagnostic;
  /** POST endpoint for recording start/stop. `{callId}` and `{action}` (start | stop) are filled in. Hosts only. */
  recordingUrl?: string;
  setRecording?: (on: boolean) => Promise<unknown>;
  /** POST endpoint for `POST /v1/calls/{id}/end`. `{callId}` is filled in. Hosts only. */
  endForAllUrl?: string;
  endForAll?: () => Promise<unknown>;

  /** Where to go after leaving, with `router.push`. Default `/`. Ignored when `onLeave` is set. */
  leaveHref?: string;
  /** Replaces the default navigation on leave. */
  onLeave?: (detail: TeleLeaveDetail) => void;
  onJoined?: (detail: TeleJoinedDetail) => void;
  onError?: (detail: TeleErrorDetail) => void;
  onParticipant?: (detail: TeleParticipantDetail) => void;
  onChat?: (detail: TeleChatDetail) => void;
  /** Render your own screen when joining fails, instead of the element's. `retry` starts over in the lobby. */
  renderError?: (error: TeleApiError | Error, retry: () => void) => ReactNode;

  /** Extra buttons for the control bar (the element's `controls` slot). */
  controls?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** leave, setMicrophone, setCamera, phase and element. */
  ref?: Ref<TeleCallRoomHandle>;
};

export function TeleCallRoom({ ref, ...props }: TeleCallRoomProps) {
  const router = useRouter();
  const el = useRef<TeleCallElement | null>(null);
  const [mounted, setMounted] = useState<TeleCallElement | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (!props.getJoin && !props.joinUrl) throw new Error("TeleCallRoom: pass joinUrl or getJoin");

  const join = useTeleJoin({
    joinUrl: props.joinUrl,
    fetchInit: props.fetchInit,
    getJoin: props.getJoin,
    lang: props.lang,
    friendlyErrors: props.friendlyErrors,
    strings: props.errorStrings,
  });
  // The endpoint URLs need the call id, which only the join response knows.
  const callId = useRef<string | undefined>(undefined);
  const fetchJoin = join.getJoin;
  const getJoin = useCallback(async () => {
    const res = await fetchJoin();
    callId.current = res.call.id;
    return res;
  }, [fetchJoin]);

  const { chatHistoryUrl, diagnosticsUrl, recordingUrl, endForAllUrl, fetchInit } = props;
  // The factories only store `id`; it is called later, from the element's requests, never during render.
  // The element captures reportDiagnostic as soon as getJoin resolves, before any re-render, so the call id
  // has to be read through a ref rather than from state. The compiler lint can't see that, hence the pragma.
  /* eslint-disable react-hooks/refs, react-hooks/preserve-manual-memoization */
  const endpoints = useMemo(() => {
    const id = () => callId.current;
    return {
      loadChatHistory: chatHistoryUrl ? createChatHistoryLoader(chatHistoryUrl, fetchInit) : undefined,
      reportDiagnostic: diagnosticsUrl ? createDiagnosticsReporter(diagnosticsUrl, id, fetchInit) : undefined,
      setRecording: recordingUrl ? createRecordingToggle(recordingUrl, id, fetchInit) : undefined,
      endForAll: endForAllUrl ? createEndForAll(endForAllUrl, id, fetchInit) : undefined,
    };
  }, [chatHistoryUrl, diagnosticsUrl, recordingUrl, endForAllUrl, fetchInit]);
  /* eslint-enable react-hooks/refs, react-hooks/preserve-manual-memoization */

  useImperativeHandle(ref, () => ({
    leave: async () => { await el.current?.leave(); },
    setMicrophone: async (on) => { await el.current?.setMicrophone(on); },
    setCamera: async (on) => { await el.current?.setCamera(on); },
    get phase() { return (el.current?.phase ?? "lobby") as Phase; },
    get element() { return el.current; },
  }), []);

  // Stable, so React doesn't detach and reattach the element (and re-render) on every render.
  const setElement = useCallback((node: TeleCallElement | null) => {
    el.current = node;
    setMounted((m) => (m === node ? m : node));
  }, []);

  const retry = () => {
    join.reset();
    setAttempt((n) => n + 1);
  };

  if (props.renderError && join.status === "error" && join.error) {
    return <>{props.renderError(join.error, retry)}</>;
  }

  const { mode, style } = resolveTheme(props.theme, props.style);
  return (
    <>
      <TeleCall
        key={`${props.joinUrl ?? "fn"}#${attempt}`}
        ref={setElement}
        className={props.className}
        style={style}
        features={props.features}
        lang={props.lang}
        theme={mode}
        layout={props.layout}
        strings={props.strings}
        getJoin={getJoin}
        loadChatHistory={props.loadChatHistory ?? endpoints.loadChatHistory}
        reportDiagnostic={props.reportDiagnostic ?? endpoints.reportDiagnostic}
        setRecording={props.setRecording ?? endpoints.setRecording}
        endForAll={props.endForAll ?? endpoints.endForAll}
        onJoined={props.onJoined}
        onError={props.onError}
        onParticipant={props.onParticipant}
        onChat={props.onChat}
        onLeave={(d) => {
          if (props.onLeave) props.onLeave(d);
          else router.push(props.leaveHref ?? "/");
        }}
      />
      {props.controls != null && mounted
        ? createPortal(<span slot="controls" style={{ display: "contents" }}>{props.controls}</span>, mounted)
        : null}
    </>
  );
}
