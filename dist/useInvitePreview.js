"use client";
import { useCallback, useEffect, useInsertionEffect, useRef, useState } from "react";
import { asTeleError, TeleApiError } from "./errors.js";
import { DEFAULT_PREVIEW_URL, fetchInvitePreview, fillUrl } from "./fetchers.js";
const MAX_DELAY = 2147e6;
function useInvitePreview(code, options = {}) {
  const { previewUrl = DEFAULT_PREVIEW_URL, initial, refreshWhenOpen = true } = options;
  const init = useRef(options.fetchInit);
  useInsertionEffect(() => {
    init.current = options.fetchInit;
  });
  const [nonce, setNonce] = useState(0);
  const key = `${nonce}|${previewUrl}|${code}`;
  const [initialKey] = useState(() => initial ? key : null);
  const [result, setResult] = useState(() => initial ? { key, code, preview: initial, error: null } : null);
  useEffect(() => {
    if (key === initialKey) return;
    const ctl = new AbortController();
    fetchInvitePreview(fillUrl(previewUrl, { code }), { ...init.current, signal: ctl.signal }).then((p) => {
      if (!p || typeof p !== "object" || !p.call) {
        throw new TeleApiError({ code: "bad_response", message: "The invite preview is malformed", status: 200 });
      }
      setResult({ key, code, preview: p, error: null });
    }).catch((e) => {
      if (ctl.signal.aborted) return;
      const err = asTeleError(e);
      setResult({ key, code, preview: null, error: err instanceof Error ? err : new Error(String(err)) });
    });
    return () => ctl.abort();
  }, [key, initialKey, previewUrl, code]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const same = result !== null && result.code === code;
  const preview = same ? result.preview : null;
  const error = same && result.key === key ? result.error : null;
  const status = error ? "error" : preview ? "ready" : "loading";
  const opensAt = preview?.reason?.code === "too_early" ? preview.reason.opens_at : void 0;
  const early = useRef(0);
  useEffect(() => {
    if (!refreshWhenOpen || !opensAt) {
      early.current = 0;
      return;
    }
    const at = new Date(opensAt).getTime();
    if (Number.isNaN(at)) return;
    const wait = at - Date.now();
    let delay;
    if (wait > 0) {
      early.current = 0;
      delay = wait + 500;
    } else {
      delay = Math.min(3e4, 1e3 * 2 ** early.current);
      early.current++;
    }
    const t = setTimeout(reload, Math.min(MAX_DELAY, delay));
    return () => clearTimeout(t);
  }, [result, opensAt, refreshWhenOpen, reload]);
  return { status, preview, error, canJoin: status === "ready" && !!preview?.can_join_now, reload };
}
export {
  useInvitePreview
};
