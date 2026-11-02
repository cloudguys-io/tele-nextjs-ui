import { afterEach, describe, expect, it, vi } from "vitest";
import { initialState, reduce } from "@tele/call-ui";
import {
  createChatHistoryLoader,
  createDiagnosticsReporter,
  createEndForAll,
  createJoinFetcher,
  createRecordingToggle,
  fetchInvitePreview,
  fillUrl,
} from "../src/fetchers.js";
import { TeleApiError } from "../src/errors.js";
import { JOIN, json, mockFetch, preview } from "./helpers.js";
import type { DiagnosticBody } from "../src/types.js";

afterEach(() => vi.unstubAllGlobals());

describe("fillUrl", () => {
  it("fills and encodes known placeholders only", () => {
    expect(fillUrl("/api/invites/{code}/join?x={other}", { code: "a b/c" })).toBe("/api/invites/a%20b%2Fc/join?x={other}");
  });
});

describe("createJoinFetcher", () => {
  it("POSTs and resolves to the join response", async () => {
    const f = mockFetch(() => json(JOIN));
    const getJoin = createJoinFetcher("/api/tele/invites/abc/join", { headers: { "X-Csrf": "t" } });
    await expect(getJoin()).resolves.toEqual(JOIN);
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("/api/tele/invites/abc/join");
    expect(init).toMatchObject({ method: "POST", headers: { Accept: "application/json", "X-Csrf": "t" } });
  });

  it("rejects with the Tele error, in a shape <tele-call> shows", async () => {
    mockFetch(() => json({ error: { code: "not_invited", message: "you are not on the participant list for this call" } }, 403));
    const err = await createJoinFetcher("/j")().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TeleApiError);
    expect(err).toMatchObject({ code: "not_invited", status: 403 });

    // The element's own reducer turns the rejection into its error screen with that message.
    const state = reduce({ ...initialState(), phase: "joining" }, { type: "failed", error: err });
    expect(state.phase).toBe("error");
    expect(state.errorCode).toBe("not_invited");
    expect(state.message).toEqual({ raw: "you are not on the participant list for this call" });
  });

  it("keeps too_early so the element uses its own label", async () => {
    mockFetch(() => json({ error: { code: "too_early", message: "not open", opens_at: "2026-10-20T03:50:00Z" } }, 409));
    const err = await createJoinFetcher("/j")().catch((e: unknown) => e);
    const state = reduce({ ...initialState(), phase: "joining" }, { type: "failed", error: err });
    expect(state.message).toEqual({ key: "tooEarly" });
    expect((err as TeleApiError).opensAt).toBe("2026-10-20T03:50:00Z");
  });

  it("rejects a body without ws_url or token", async () => {
    mockFetch(() => json({ hello: 1 }));
    await expect(createJoinFetcher("/j")()).rejects.toMatchObject({ code: "bad_response" });
  });
});

describe("createChatHistoryLoader", () => {
  it("GETs with the call id and returns messages", async () => {
    const messages = [{ stream_id: "s1", user_id: "u1", name: "A", body: "hi" }];
    const f = mockFetch(() => json({ messages }));
    await expect(createChatHistoryLoader("/api/calls/{callId}/messages")("c/1")).resolves.toEqual(messages);
    expect(f.mock.calls[0]![0]).toBe("/api/calls/c%2F1/messages");
    expect(f.mock.calls[0]![1]!.method).toBe("GET");
  });

  it("accepts a bare array and an empty body", async () => {
    mockFetch(() => json([{ stream_id: "s", user_id: "u", body: "b" }]));
    await expect(createChatHistoryLoader("/m")("c")).resolves.toHaveLength(1);
    mockFetch(() => new Response(null, { status: 204 }));
    await expect(createChatHistoryLoader("/m")("c")).resolves.toEqual([]);
  });
});

describe("createDiagnosticsReporter", () => {
  const body: DiagnosticBody = { grant_id: "g", participant_sid: "PA_1", kind: "connected", payload: { rtt_ms: 20 } };

  it("POSTs the body unchanged with keepalive", async () => {
    const f = mockFetch(() => new Response(null, { status: 204 }));
    await createDiagnosticsReporter("/api/calls/{callId}/diagnostics", () => "c1")("connected", body);
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe("/api/calls/c1/diagnostics");
    expect(init).toMatchObject({ method: "POST", keepalive: true, headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(init!.body as string)).toEqual(body);
  });

  it("keeps headers given as a Headers instance", async () => {
    const f = mockFetch(() => new Response(null, { status: 204 }));
    await createDiagnosticsReporter("/d/{callId}", () => "c1", { headers: new Headers({ "X-Csrf": "t" }) })("connected", body);
    expect(f.mock.calls[0]![1]!.headers).toEqual({ Accept: "application/json", "Content-Type": "application/json", "x-csrf": "t" });
  });

  it("rejects session_pending so the element retries", async () => {
    mockFetch(() => json({ error: { code: "session_pending", message: "no session yet" } }, 409));
    await expect(createDiagnosticsReporter("/d/{callId}", () => "c1")("snapshot", body)).rejects.toMatchObject({ code: "session_pending" });
  });

  it("does nothing before the call id is known", async () => {
    const f = mockFetch(() => json({}));
    await createDiagnosticsReporter("/d/{callId}", () => undefined)("connected", body);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("createRecordingToggle", () => {
  it("fills {action}", async () => {
    const f = mockFetch(() => json({ id: "r1" }));
    const toggle = createRecordingToggle("/api/calls/{callId}/recording/{action}", () => "c1");
    await toggle(true);
    await toggle(false);
    expect(f.mock.calls.map((c) => [c[0], c[1]!.method])).toEqual([
      ["/api/calls/c1/recording/start", "POST"],
      ["/api/calls/c1/recording/stop", "POST"],
    ]);
  });

  it("appends /start or /stop without {action}", async () => {
    const f = mockFetch(() => json({}));
    await createRecordingToggle("/api/calls/{callId}/recording/", () => "c1")(true);
    expect(f.mock.calls[0]![0]).toBe("/api/calls/c1/recording/start");
  });

  it("rejects Tele errors", async () => {
    mockFetch(() => json({ error: { code: "already_recording", message: "already" } }, 409));
    await expect(createRecordingToggle("/r/{action}", () => "c")(true)).rejects.toMatchObject({ code: "already_recording" });
  });
});

describe("createEndForAll", () => {
  it("POSTs to the end endpoint", async () => {
    const f = mockFetch(() => new Response(null, { status: 204 }));
    await createEndForAll("/api/calls/{callId}/end", () => "c9")();
    expect(f.mock.calls[0]![0]).toBe("/api/calls/c9/end");
    expect(f.mock.calls[0]![1]!.method).toBe("POST");
  });
});

describe("fetchInvitePreview", () => {
  it("GETs the preview", async () => {
    const p = preview();
    const f = mockFetch(() => json(p));
    await expect(fetchInvitePreview("/p")).resolves.toEqual(p);
    expect(f.mock.calls[0]![1]!.method).toBe("GET");
  });
});
