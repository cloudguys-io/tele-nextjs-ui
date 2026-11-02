import { requestJson, TeleApiError } from "./errors.js";
const DEFAULT_PREVIEW_URL = "/api/tele/invites/{code}";
const DEFAULT_JOIN_URL = "/api/tele/invites/{code}/join";
function fillUrl(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, k) => k in vars ? encodeURIComponent(vars[k]) : m);
}
function createJoinFetcher(url, init) {
  return async () => {
    const body = await requestJson(url, { method: "POST", ...init });
    if (!body || typeof body.ws_url !== "string" || typeof body.token !== "string") {
      throw new TeleApiError({ code: "bad_response", message: "The join response is missing ws_url or token", status: 200 });
    }
    return body;
  };
}
function createChatHistoryLoader(template, init) {
  return async (callId) => {
    const body = await requestJson(
      fillUrl(template, { callId }),
      { method: "GET", ...init }
    );
    if (Array.isArray(body)) return body;
    return body?.messages ?? [];
  };
}
function createDiagnosticsReporter(template, callId, init) {
  return async (_kind, body) => {
    const id = callId();
    if (!id) return;
    await requestJson(fillUrl(template, { callId: id }), {
      method: "POST",
      keepalive: true,
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: JSON.stringify(body)
    });
  };
}
function createRecordingToggle(template, callId, init) {
  return (on) => {
    const action = on ? "start" : "stop";
    const id = callId() ?? "";
    const url = template.includes("{action}") ? fillUrl(template, { callId: id, action }) : `${fillUrl(template, { callId: id }).replace(/\/+$/, "")}/${action}`;
    return requestJson(url, { method: "POST", ...init });
  };
}
function createEndForAll(template, callId, init) {
  return () => requestJson(fillUrl(template, { callId: callId() ?? "" }), { method: "POST", ...init });
}
function fetchInvitePreview(url, init) {
  return requestJson(url, { method: "GET", ...init });
}
export {
  DEFAULT_JOIN_URL,
  DEFAULT_PREVIEW_URL,
  createChatHistoryLoader,
  createDiagnosticsReporter,
  createEndForAll,
  createJoinFetcher,
  createRecordingToggle,
  fetchInvitePreview,
  fillUrl
};
