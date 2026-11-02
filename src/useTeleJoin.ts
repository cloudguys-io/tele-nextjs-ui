"use client";
// Wraps a join source (your backend URL or your own function) into the getJoin <tele-call> needs, and keeps
// what happened: the join response, or the error with a friendly message in the chosen language.
import { useCallback, useInsertionEffect, useMemo, useRef, useState } from "react";
import { TeleApiError, asTeleError } from "./errors.js";
import { createJoinFetcher } from "./fetchers.js";
import { reasonMessage, type InviteStrings } from "./messages.js";
import type { JoinResponse } from "./types.js";

export type UseTeleJoinOptions = {
  /** Your backend's join endpoint, POSTed to. It returns Tele's join response or error body unchanged. */
  joinUrl?: string;
  /** Extra fetch options for `joinUrl`, such as headers. */
  joinInit?: RequestInit;
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

  const getJoin = useCallback(async () => {
    const o = latest.current;
    const source = o.getJoin ?? (o.joinUrl ? createJoinFetcher(o.joinUrl, o.joinInit) : null);
    const id = ++run.current;
    setStatus("joining");
    setError(null);
    try {
      if (!source) throw new Error("useTeleJoin: pass joinUrl or getJoin");
      const res = await source();
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
  // too_early keeps its code, so the element can still show its own label if the text is cleared.
  const text = reasonMessage(e.code, { lang: o.lang, opensAt: e.opensAt, strings: o.strings });
  return text ? e.withMessage(text) : e;
}
