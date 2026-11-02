"use client";
// Loads an invite preview (the body of GET /v1/invites/{code}) from your backend, and reloads it when a
// too_early call opens so `canJoin` flips without a page refresh.
import { useCallback, useEffect, useInsertionEffect, useRef, useState } from "react";
import { asTeleError, TeleApiError } from "./errors.js";
import { DEFAULT_PREVIEW_URL, fetchInvitePreview, fillUrl } from "./fetchers.js";
import type { InvitePreview } from "./types.js";

export type UseInvitePreviewOptions = {
  /** Your endpoint that forwards `GET /v1/invites/{code}` with the signed-in person's user token. */
  previewUrl?: string;
  /** Extra fetch options, such as headers. */
  fetchInit?: RequestInit;
  /** Use this preview instead of fetching one (for example, loaded by a server component). */
  initial?: InvitePreview;
  /** Reload when a too_early call opens. Default true. */
  refreshWhenOpen?: boolean;
};

export type InvitePreviewState = {
  status: "loading" | "ready" | "error";
  preview: InvitePreview | null;
  error: TeleApiError | Error | null;
  /** True when the person can join now. */
  canJoin: boolean;
  /** Fetches the preview again. */
  reload: () => void;
};

// setTimeout fires immediately above 2^31-1 ms (about 24.8 days).
const MAX_DELAY = 2_147_000_000;

type Result = { key: string; code: string; preview: InvitePreview | null; error: TeleApiError | Error | null };

export function useInvitePreview(code: string, options: UseInvitePreviewOptions = {}): InvitePreviewState {
  const { previewUrl = DEFAULT_PREVIEW_URL, initial, refreshWhenOpen = true } = options;
  const init = useRef(options.fetchInit);
  useInsertionEffect(() => {
    init.current = options.fetchInit;
  });
  const [nonce, setNonce] = useState(0);
  const key = `${nonce}|${previewUrl}|${code}`;
  // A preview passed in stands for the first load of that code, so it is not fetched again.
  const [initialKey] = useState(() => (initial ? key : null));
  const [result, setResult] = useState<Result | null>(() =>
    initial ? { key, code, preview: initial, error: null } : null);

  useEffect(() => {
    if (key === initialKey) return;
    const ctl = new AbortController();
    fetchInvitePreview<InvitePreview>(fillUrl(previewUrl, { code }), { ...init.current, signal: ctl.signal })
      .then((p) => {
        if (!p || typeof p !== "object" || !p.call) {
          throw new TeleApiError({ code: "bad_response", message: "The invite preview is malformed", status: 200 });
        }
        setResult({ key, code, preview: p, error: null });
      })
      .catch((e: unknown) => {
        if (ctl.signal.aborted) return;
        const err = asTeleError(e);
        setResult({ key, code, preview: null, error: err instanceof Error ? err : new Error(String(err)) });
      });
    return () => ctl.abort();
  }, [key, initialKey, previewUrl, code]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // While reloading the same code, keep showing the last preview instead of flashing "loading".
  const same = result !== null && result.code === code;
  const preview = same ? result.preview : null;
  const error = same && result.key === key ? result.error : null;
  const status: InvitePreviewState["status"] = error ? "error" : preview ? "ready" : "loading";

  // A too_early preview reloads when the call opens. If the reader's clock runs ahead of Tele's, the reload
  // can still say too_early with an opens_at in the past: every such result re-arms the timer with a
  // growing delay (1s, 2s, 4s ... 30s) until Tele says the call is open.
  const opensAt = preview?.reason?.code === "too_early" ? preview.reason.opens_at : undefined;
  const early = useRef(0);
  useEffect(() => {
    if (!refreshWhenOpen || !opensAt) {
      early.current = 0;
      return;
    }
    const at = new Date(opensAt).getTime();
    if (Number.isNaN(at)) return;
    const wait = at - Date.now();
    let delay: number;
    if (wait > 0) {
      early.current = 0;
      delay = wait + 500;
    } else {
      delay = Math.min(30_000, 1_000 * 2 ** early.current);
      early.current++;
    }
    const t = setTimeout(reload, Math.min(MAX_DELAY, delay));
    return () => clearTimeout(t);
  }, [result, opensAt, refreshWhenOpen, reload]);

  return { status, preview, error, canJoin: status === "ready" && !!preview?.can_join_now, reload };
}
