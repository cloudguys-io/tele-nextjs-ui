"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation.js";
import { TeleCall } from "@tele/call-ui/react";
import { createChatHistoryLoader, createDiagnosticsReporter, createEndForAll, createRecordingToggle } from "./fetchers.js";
import { resolveTheme } from "./theme.js";
import { useTeleJoin } from "./useTeleJoin.js";
function TeleCallRoom({ ref, ...props }) {
  const router = useRouter();
  const el = useRef(null);
  const [mounted, setMounted] = useState(null);
  const [attempt, setAttempt] = useState(0);
  if (!props.getJoin && !props.joinUrl) throw new Error("TeleCallRoom: pass joinUrl or getJoin");
  const join = useTeleJoin({
    joinUrl: props.joinUrl,
    fetchInit: props.fetchInit,
    getJoin: props.getJoin,
    lang: props.lang,
    friendlyErrors: props.friendlyErrors,
    strings: props.errorStrings
  });
  const callId = useRef(void 0);
  const fetchJoin = join.getJoin;
  const getJoin = useCallback(async () => {
    const res = await fetchJoin();
    callId.current = res.call.id;
    return res;
  }, [fetchJoin]);
  const { chatHistoryUrl, diagnosticsUrl, recordingUrl, endForAllUrl, fetchInit } = props;
  const endpoints = useMemo(() => {
    const id = () => callId.current;
    return {
      loadChatHistory: chatHistoryUrl ? createChatHistoryLoader(chatHistoryUrl, fetchInit) : void 0,
      reportDiagnostic: diagnosticsUrl ? createDiagnosticsReporter(diagnosticsUrl, id, fetchInit) : void 0,
      setRecording: recordingUrl ? createRecordingToggle(recordingUrl, id, fetchInit) : void 0,
      endForAll: endForAllUrl ? createEndForAll(endForAllUrl, id, fetchInit) : void 0
    };
  }, [chatHistoryUrl, diagnosticsUrl, recordingUrl, endForAllUrl, fetchInit]);
  useImperativeHandle(ref, () => ({
    leave: async () => {
      await el.current?.leave();
    },
    setMicrophone: async (on) => {
      await el.current?.setMicrophone(on);
    },
    setCamera: async (on) => {
      await el.current?.setCamera(on);
    },
    get phase() {
      return el.current?.phase ?? "lobby";
    },
    get element() {
      return el.current;
    }
  }), []);
  const setElement = useCallback((node) => {
    el.current = node;
    setMounted((m) => m === node ? m : node);
  }, []);
  const retry = () => {
    join.reset();
    setAttempt((n) => n + 1);
  };
  if (props.renderError && join.status === "error" && join.error) {
    return /* @__PURE__ */ jsx(Fragment, { children: props.renderError(join.error, retry) });
  }
  const { mode, style } = resolveTheme(props.theme, props.style);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      TeleCall,
      {
        ref: setElement,
        className: props.className,
        style,
        features: props.features,
        lang: props.lang,
        theme: mode,
        layout: props.layout,
        strings: props.strings,
        getJoin,
        loadChatHistory: props.loadChatHistory ?? endpoints.loadChatHistory,
        reportDiagnostic: props.reportDiagnostic ?? endpoints.reportDiagnostic,
        setRecording: props.setRecording ?? endpoints.setRecording,
        endForAll: props.endForAll ?? endpoints.endForAll,
        onJoined: props.onJoined,
        onError: props.onError,
        onParticipant: props.onParticipant,
        onChat: props.onChat,
        onLeave: (d) => {
          if (props.onLeave) props.onLeave(d);
          else router.push(props.leaveHref ?? "/");
        }
      },
      `${props.joinUrl ?? "fn"}#${attempt}`
    ),
    props.controls != null && mounted ? createPortal(/* @__PURE__ */ jsx("span", { slot: "controls", style: { display: "contents" }, children: props.controls }), mounted) : null
  ] });
}
export {
  TeleCallRoom
};
