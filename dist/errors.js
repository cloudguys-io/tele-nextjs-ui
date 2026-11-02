class TeleApiError extends Error {
  name = "TeleApiError";
  /** Tele's error code (`too_early`, `not_invited`, ...), `network_error`, or `bad_response`. */
  code;
  /** HTTP status, or 0 when the request never got a response. */
  status;
  /** For `too_early`: when the join window opens (RFC 3339). */
  opensAt;
  /** Tele's own message, kept when `message` is replaced by friendlier text. */
  serverMessage;
  constructor(init) {
    super(init.message);
    this.code = init.code;
    this.status = init.status;
    if (init.opensAt) this.opensAt = init.opensAt;
    this.serverMessage = init.serverMessage ?? init.message;
  }
  /** The same error with a different user-facing message. */
  withMessage(message) {
    return new TeleApiError({ code: this.code, message, status: this.status, opensAt: this.opensAt, serverMessage: this.serverMessage });
  }
}
function isErrorObject(v) {
  return typeof v === "object" && v !== null && typeof v.code === "string";
}
async function errorFromResponse(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
  }
  const inner = body?.error;
  if (isErrorObject(inner)) {
    return new TeleApiError({
      code: inner.code,
      message: typeof inner.message === "string" && inner.message ? inner.message : inner.code,
      status: res.status,
      opensAt: typeof inner.opens_at === "string" ? inner.opens_at : void 0
    });
  }
  return new TeleApiError({ code: "bad_response", message: `Request failed (HTTP ${res.status})`, status: res.status });
}
function asTeleError(e) {
  if (e instanceof Error || !isErrorObject(e)) return e;
  return new TeleApiError({ code: e.code, message: e.message || e.code, status: 0, opensAt: e.opens_at });
}
function networkError(e) {
  if (e instanceof DOMException && e.name === "AbortError") return e;
  return new TeleApiError({ code: "network_error", message: e instanceof Error ? e.message : "Network error", status: 0 });
}
async function requestJson(url, init) {
  let res;
  try {
    res = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: { Accept: "application/json", ...headersObject(init?.headers) }
    });
  } catch (e) {
    throw networkError(e);
  }
  if (!res.ok) throw await errorFromResponse(res);
  if (res.status === 204) return void 0;
  const text = await res.text();
  if (!text) return void 0;
  try {
    return JSON.parse(text);
  } catch {
    throw new TeleApiError({ code: "bad_response", message: "The response was not JSON", status: res.status });
  }
}
function headersObject(h) {
  if (!h) return {};
  if (typeof Headers !== "undefined" && h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return h;
}
export {
  TeleApiError,
  asTeleError,
  errorFromResponse,
  headersObject,
  requestJson
};
