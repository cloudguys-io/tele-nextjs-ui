"use client";
// Wraps a join source (your backend URL or your own function) into the getJoin <tele-call> needs, and keeps
// what happened: the join response, or the error with a friendly message in the chosen language.
import { useCallback, useInsertionEffect, useMemo, useRef, useState } from "react";
import { TeleApiError, asTeleError } from "./errors.js";
import { createJoinFetcher, fillUrl } from "./fetchers.js";
import { reasonMessage, type InviteStrings } from "./messages.js";
import type { JoinResponse } from "./types.js";

export type UseTeleJoinOptions = {
  /** Your backend's join endpoint, POSTed to. It returns Tele's join response or error body unchanged. */
  joinUrl?: string;
  /** Extra fetch options for `joinUrl`, such as headers. */
  fetchInit?: RequestInit;
  /**
   * After a successful join through `joinUrl`, later joins (Rejoin, retry) POST here instead, with `{callId}`
   * filled in from the first join response. Use the call-id route (`/api/tele/calls/{callId}/join`): it carries
   * the person's IP, while an invite join through a backend records the backend's IP.
   */
  rejoinUrl?: string;
  /** Your own join function, instead of `joinUrl`. Reject with a Tele error object to show its message. */
  getJoin?: () => Promise<JoinResponse>;
  /** Language of the friendly error text. Default `en`. */
  lang?: string;
  /** Replace Tele's error messages with friendly text for known codes. Default true. */
  friendlyErrors?: boolean;
  /** Overrides for the friendly texts. */
  strings?: Partial<InviteStrings>;
};

export type TeleJoinStatus = "idle" | "joining" | "joined" | "error";

export type TeleJoinState = {
  status: TeleJoinStatus;
  /** The last successful join response. */
  join: JoinResponse | null;
  /** The last failure. Tele errors are TeleApiError with `code`. */
  error: TeleApiError | Error | null;
  /** Fetches a join response. Stable across renders; pass it to `<TeleCall getJoin>` or call it yourself. */
  getJoin: () => Promise<JoinResponse>;
  /** Back to `idle`, forgetting the response and error. */
  reset: () => void;
};

export function useTeleJoin(options: UseTeleJoinOptions): TeleJoinState {
  const latest = useRef(options);
  useInsertionEffect(() => {
    latest.current = options;
  });
  const [status, setStatus] = useState<TeleJoinStatus>("idle");
  const [join, setJoin] = useState<JoinResponse | null>(null);
  const [error, setError] = useState<TeleApiError | Error | null>(null);
  const run = useRef(0);
  // The call of the last successful join; kept across reset() so a retry rejoins by call id.
  const joinedCall = useRef<string | null>(null);

  const getJoin = useCallback(async () => {
    const o = latest.current;
    const url = o.joinUrl && o.rejoinUrl && joinedCall.current ? fillUrl(o.rejoinUrl, { callId: joinedCall.current }) : o.joinUrl;
    const source = o.getJoin ?? (url ? createJoinFetcher(url, o.fetchInit) : null);
    const id = ++run.current;
    setStatus("joining");
    setError(null);
    try {
      if (!source) throw new Error("useTeleJoin: pass joinUrl or getJoin");
      const res = await source();
      joinedCall.current = res.call.id;
      if (id === run.current) {
        setJoin(res);
        setStatus("joined");
      }
      return res;
    } catch (e) {
      const err = friendly(asTeleError(e), o);
      if (id === run.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    run.current++;
    setStatus("idle");
    setJoin(null);
    setError(null);
  }, []);

  return useMemo(() => ({ status, join, error, getJoin, reset }), [status, join, error, getJoin, reset]);
}

function friendly(e: unknown, o: UseTeleJoinOptions): unknown {
  if (!(e instanceof TeleApiError) || o.friendlyErrors === false) return e;
  // <tele-call> ignores `message` for too_early and always shows its own `tooEarly` label (change it with
  // `strings.tooEarly`). The "opens at" text set here is only seen through renderError or your own UI.
  const text = reasonMessage(e.code, { lang: o.lang, opensAt: e.opensAt, strings: o.strings });
  return text ? e.withMessage(text) : e;
}
