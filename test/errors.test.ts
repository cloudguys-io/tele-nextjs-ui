import { afterEach, describe, expect, it, vi } from "vitest";
import { asTeleError, errorFromResponse, requestJson, TeleApiError } from "../src/errors.js";
import { json, mockFetch } from "./helpers.js";

afterEach(() => vi.unstubAllGlobals());

describe("errorFromResponse", () => {
  it("reads a Tele error body", async () => {
    const e = await errorFromResponse(json({ error: { code: "too_early", message: "not open", opens_at: "2026-10-20T03:50:00Z" } }, 409));
    expect(e).toBeInstanceOf(TeleApiError);
    expect(e).toMatchObject({ code: "too_early", message: "not open", status: 409, opensAt: "2026-10-20T03:50:00Z", serverMessage: "not open" });
  });

  it("falls back for bodies that are not Tele errors", async () => {
    const e = await errorFromResponse(new Response("<html>bad gateway</html>", { status: 502 }));
    expect(e).toMatchObject({ code: "bad_response", status: 502, message: "Request failed (HTTP 502)" });
    const e2 = await errorFromResponse(json({ detail: "nope" }, 400));
    expect(e2.code).toBe("bad_response");
  });

  it("uses the code when the message is empty", async () => {
    const e = await errorFromResponse(json({ error: { code: "forbidden", message: "" } }, 403));
    expect(e.message).toBe("forbidden");
  });
});

describe("asTeleError", () => {
  it("converts plain Tele error objects", () => {
    const e = asTeleError({ code: "not_invited", message: "you are not on the list" });
    expect(e).toBeInstanceOf(TeleApiError);
    expect(e).toMatchObject({ code: "not_invited", status: 0 });
  });

  it("leaves Errors and other values alone", () => {
    const err = new Error("x");
    expect(asTeleError(err)).toBe(err);
    expect(asTeleError("boom")).toBe("boom");
    expect(asTeleError(null)).toBe(null);
  });

  it("withMessage keeps the code and the server message", () => {
    const e = new TeleApiError({ code: "call_full", message: "call is full", status: 409 }).withMessage("Full!");
    expect(e).toMatchObject({ code: "call_full", message: "Full!", serverMessage: "call is full", status: 409 });
  });
});

describe("requestJson", () => {
  it("sends Accept and same-origin credentials, keeping caller headers", async () => {
    const f = mockFetch(() => json({ ok: true }));
    await expect(requestJson("/x", { headers: new Headers({ "X-A": "1" }) })).resolves.toEqual({ ok: true });
    const init = f.mock.calls[0]![1]!;
    expect(init.credentials).toBe("same-origin");
    expect(init.headers).toEqual({ Accept: "application/json", "x-a": "1" });
  });

  it("accepts array headers", async () => {
    const f = mockFetch(() => json({}));
    await requestJson("/x", { headers: [["X-B", "2"]] });
    expect(f.mock.calls[0]![1]!.headers).toEqual({ Accept: "application/json", "X-B": "2" });
  });

  it("resolves undefined for 204 and empty bodies", async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    await expect(requestJson("/x")).resolves.toBeUndefined();
    mockFetch(() => new Response("", { status: 200 }));
    await expect(requestJson("/x")).resolves.toBeUndefined();
  });

  it("rejects non-JSON success bodies", async () => {
    mockFetch(() => new Response("hello", { status: 200 }));
    await expect(requestJson("/x")).rejects.toMatchObject({ code: "bad_response" });
  });

  it("turns fetch failures into network_error and passes aborts through", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(requestJson("/x")).rejects.toMatchObject({ code: "network_error", message: "Failed to fetch", status: 0 });
    const abort = new DOMException("aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(abort)));
    await expect(requestJson("/x")).rejects.toBe(abort);
  });

  it("rejects Tele error bodies with TeleApiError", async () => {
    mockFetch(() => json({ error: { code: "unauthenticated", message: "token expired" } }, 401));
    await expect(requestJson("/x")).rejects.toMatchObject({ name: "TeleApiError", code: "unauthenticated", status: 401 });
  });
});
