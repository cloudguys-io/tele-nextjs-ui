"use client";
import { useCallback, useInsertionEffect, useMemo, useRef, useState } from "react";
import { TeleApiError, asTeleError } from "./errors.js";
import { createJoinFetcher } from "./fetchers.js";
import { reasonMessage } from "./messages.js";
function useTeleJoin(options) {
  const latest = useRef(options);
  useInsertionEffect(() => {
    latest.current = options;
  });
  const [status, setStatus] = useState("idle");
  const [join, setJoin] = useState(null);
  const [error, setError] = useState(null);
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
function friendly(e, o) {
  if (!(e instanceof TeleApiError) || o.friendlyErrors === false) return e;
  const text = reasonMessage(e.code, { lang: o.lang, opensAt: e.opensAt, strings: o.strings });
  return text ? e.withMessage(text) : e;
}
export {
  useTeleJoin
};
