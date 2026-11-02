// Tele error bodies -> rejections <tele-call> understands. The element reads `code` and `message` from what
// getJoin() rejects with: `too_early` gets its own label, anything else shows `message`.
import type { TeleErrorBody, TeleErrorObject } from "./types.js";

/** A failed request to your backend, carrying Tele's error code when the body had one. */
export class TeleApiError extends Error {
  override readonly name = "TeleApiError";
  /** Tele's error code (`too_early`, `not_invited`, ...), `network_error`, or `bad_response`. */
  readonly code: string;
  /** HTTP status, or 0 when the request never got a response. */
  readonly status: number;
  /** For `too_early`: when the join window opens (RFC 3339). */
  readonly opensAt?: string;
  /** Tele's own message, kept when `message` is replaced by friendlier text. */
  readonly serverMessage: string;

  constructor(init: { code: string; message: string; status: number; opensAt?: string; serverMessage?: string }) {
    super(init.message);
    this.code = init.code;
    this.status = init.status;
    if (init.opensAt) this.opensAt = init.opensAt;
    this.serverMessage = init.serverMessage ?? init.message;
  }

  /** The same error with a different user-facing message. */
  withMessage(message: string): TeleApiError {
    return new TeleApiError({ code: this.code, message, status: this.status, opensAt: this.opensAt, serverMessage: this.serverMessage });
  }
}

function isErrorObject(v: unknown): v is TeleErrorObject {
  return typeof v === "object" && v !== null && typeof (v as { code?: unknown }).code === "string";
}

/** Builds a TeleApiError from a non-2xx response. Never throws. */
export async function errorFromResponse(res: Response): Promise<TeleApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // not JSON: a proxy error page, an empty 502, ...
  }
  const inner = (body as Partial<TeleErrorBody> | null)?.error;
  if (isErrorObject(inner)) {
    return new TeleApiError({
      code: inner.code,
      message: typeof inner.message === "string" && inner.message ? inner.message : inner.code,
      status: res.status,
      opensAt: typeof inner.opens_at === "string" ? inner.opens_at : undefined,
    });
  }
  return new TeleApiError({ code: "bad_response", message: `Request failed (HTTP ${res.status})`, status: res.status });
}

/**
 * Turns a plain Tele error object (`{ code, message, opens_at? }`, what a hand-written getJoin rejects with)
 * into a TeleApiError. Anything else is returned unchanged.
 */
export function asTeleError(e: unknown): unknown {
  if (e instanceof Error || !isErrorObject(e)) return e;
  return new TeleApiError({ code: e.code, message: e.message || e.code, status: 0, opensAt: e.opens_at });
}

// fetch() itself failed: offline, DNS, CORS, ... AbortErrors are passed through.
function networkError(e: unknown): unknown {
  if (e instanceof DOMException && e.name === "AbortError") return e;
  return new TeleApiError({ code: "network_error", message: e instanceof Error ? e.message : "Network error", status: 0 });
}

/** fetch + JSON with Tele error handling. Resolves to undefined for 204 or an empty body. */
export async function requestJson<T>(url: string | URL, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: { Accept: "application/json", ...headersObject(init?.headers) },
    });
  } catch (e) {
    throw networkError(e);
  }
  if (!res.ok) throw await errorFromResponse(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new TeleApiError({ code: "bad_response", message: "The response was not JSON", status: res.status });
  }
}

function headersObject(h: HeadersInit | undefined): Record<string, string> {
  if (!h) return {};
  if (typeof Headers !== "undefined" && h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return h as Record<string, string>;
}
