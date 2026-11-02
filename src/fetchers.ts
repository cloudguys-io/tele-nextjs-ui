// Functions for <tele-call>'s properties, built from your backend's URLs. Server safe: no React, no window.
// URL templates take {code}, {callId} and (for recording) {action}; values are URL-encoded.
import { headersObject, requestJson, TeleApiError } from "./errors.js";
import type { DiagnosticBody, DiagnosticKind, HistoryMessage, JoinResponse } from "./types.js";

/** The default preview endpoint on your backend. `{code}` is replaced with the URL-encoded invite code. */
export const DEFAULT_PREVIEW_URL = "/api/tele/invites/{code}";

/**
 * The default invite join endpoint on your backend (a service-token join that carries the person's IP and user
 * agent). `{code}` is replaced with the URL-encoded invite code.
 */
export const DEFAULT_JOIN_URL = "/api/tele/invites/{code}/join";

/**
 * The call-id join endpoint of the shared backend convention (a service-token join that carries the person's
 * IP and user agent). Used for rejoins after the first invite join. `{callId}` is replaced.
 */
export const DEFAULT_CALL_JOIN_URL = "/api/tele/calls/{callId}/join";

/** Saved chat (`GET /v1/calls/{id}/messages`) in the shared backend convention. Opt in with `chatHistoryUrl`. */
export const DEFAULT_CHAT_HISTORY_URL = "/api/tele/calls/{callId}/messages";

/** Diagnostics (`POST /v1/calls/{id}/diagnostics`) in the shared backend convention. Opt in with `diagnosticsUrl`. */
export const DEFAULT_DIAGNOSTICS_URL = "/api/tele/calls/{callId}/diagnostics";

/** Replaces `{name}` placeholders with URL-encoded values. Unknown placeholders are left as they are. */
export function fillUrl(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? encodeURIComponent(vars[k] as string) : m));
}

/**
 * A `getJoin` for `<tele-call>`: POSTs to your backend's join endpoint (which calls
 * `POST /v1/invites/{code}/join` or `POST /v1/calls/{id}/join` and returns the body unchanged).
 * A Tele error body becomes a rejected TeleApiError with `code` and `message`, which the element shows.
 */
export function createJoinFetcher(url: string | URL, init?: RequestInit): () => Promise<JoinResponse> {
  return async () => {
    const body = await requestJson<JoinResponse | undefined>(url, { method: "POST", ...init });
    if (!body || typeof body.ws_url !== "string" || typeof body.token !== "string") {
      throw new TeleApiError({ code: "bad_response", message: "The join response is missing ws_url or token", status: 200 });
    }
    return body;
  };
}

/** `loadChatHistory`: GETs `{callId}` from your endpoint, which forwards `GET /v1/calls/{id}/messages`. */
export function createChatHistoryLoader(template: string, init?: RequestInit): (callId: string) => Promise<HistoryMessage[]> {
  return async (callId) => {
    const body = await requestJson<{ messages?: HistoryMessage[] } | HistoryMessage[] | undefined>(
      fillUrl(template, { callId }), { method: "GET", ...init });
    if (Array.isArray(body)) return body;
    return body?.messages ?? [];
  };
}

/**
 * `reportDiagnostic`: POSTs the body unchanged (your endpoint forwards it to `POST /v1/calls/{id}/diagnostics`).
 * A `session_pending` answer rejects with that code, so the element retries.
 */
export function createDiagnosticsReporter(
  template: string,
  callId: () => string | undefined,
  init?: RequestInit,
): (kind: DiagnosticKind, body: DiagnosticBody) => Promise<void> {
  return async (_kind, body) => {
    const id = callId();
    if (!id) return;
    await requestJson<unknown>(fillUrl(template, { callId: id }), {
      method: "POST",
      keepalive: true,
      ...init,
      headers: { "Content-Type": "application/json", ...headersObject(init?.headers) },
      body: JSON.stringify(body),
    });
  };
}

/**
 * `setRecording`: POSTs to your endpoint for `POST /v1/calls/{id}/recording/start` or `/stop`.
 * `{action}` in the template becomes `start` or `stop`; without it, `/start` or `/stop` is appended.
 */
export function createRecordingToggle(template: string, callId: () => string | undefined, init?: RequestInit): (on: boolean) => Promise<unknown> {
  return (on) => {
    const action = on ? "start" : "stop";
    const id = callId() ?? "";
    const url = template.includes("{action}")
      ? fillUrl(template, { callId: id, action })
      : `${fillUrl(template, { callId: id }).replace(/\/+$/, "")}/${action}`;
    return requestJson<unknown>(url, { method: "POST", ...init });
  };
}

/** `endForAll`: POSTs to your endpoint for `POST /v1/calls/{id}/end`. */
export function createEndForAll(template: string, callId: () => string | undefined, init?: RequestInit): () => Promise<unknown> {
  return () => requestJson<unknown>(fillUrl(template, { callId: callId() ?? "" }), { method: "POST", ...init });
}

/** GETs an invite preview from your endpoint, which forwards `GET /v1/invites/{code}`. */
export function fetchInvitePreview<T>(url: string, init?: RequestInit): Promise<T> {
  return requestJson<T>(url, { method: "GET", ...init });
}
