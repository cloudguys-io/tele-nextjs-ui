import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useTeleJoin } from "../src/useTeleJoin.js";
import { TeleApiError } from "../src/errors.js";
import { JOIN, json, mockFetch } from "./helpers.js";

afterEach(() => vi.unstubAllGlobals());

describe("useTeleJoin", () => {
  it("joins through joinUrl and records the response", async () => {
    const f = mockFetch(() => json(JOIN));
    const { result } = renderHook(() => useTeleJoin({ joinUrl: "/api/join" }));
    expect(result.current.status).toBe("idle");
    let res: unknown;
    await act(async () => { res = await result.current.getJoin(); });
    expect(res).toEqual(JOIN);
    expect(result.current).toMatchObject({ status: "joined", join: JOIN, error: null });
    expect(f.mock.calls[0]![1]!.method).toBe("POST");
  });

  it("rejoins through rejoinUrl after the first join, also after reset", async () => {
    const f = mockFetch(() => json(JOIN));
    const { result } = renderHook(() => useTeleJoin({ joinUrl: "/api/tele/invites/abc/join", rejoinUrl: "/api/tele/calls/{callId}/join" }));
    await act(async () => { await result.current.getJoin(); });
    await act(async () => { await result.current.getJoin(); });
    act(() => result.current.reset());
    await act(async () => { await result.current.getJoin(); });
    expect(f.mock.calls.map((c) => c[0])).toEqual([
      "/api/tele/invites/abc/join", "/api/tele/calls/call-1/join", "/api/tele/calls/call-1/join",
    ]);
  });

  it("keeps using joinUrl until a join succeeds", async () => {
    let n = 0;
    const f = mockFetch(() => (n++ === 0 ? json({ error: { code: "call_full", message: "full" } }, 409) : json(JOIN)));
    const { result } = renderHook(() => useTeleJoin({ joinUrl: "/inv", rejoinUrl: "/calls/{callId}/join" }));
    await act(async () => { await result.current.getJoin().catch(() => {}); });
    await act(async () => { await result.current.getJoin(); });
    expect(f.mock.calls.map((c) => c[0])).toEqual(["/inv", "/inv"]);
  });

  it("keeps getJoin stable across renders and uses the latest source", async () => {
    const a = vi.fn(async () => JOIN);
    const b = vi.fn(async () => ({ ...JOIN, grant_id: "g-2" }));
    const { result, rerender } = renderHook(({ fn }) => useTeleJoin({ getJoin: fn }), { initialProps: { fn: a } });
    const first = result.current.getJoin;
    rerender({ fn: b });
    expect(result.current.getJoin).toBe(first);
    await act(async () => { await result.current.getJoin(); });
    expect(a).not.toHaveBeenCalled();
    expect(result.current.join?.grant_id).toBe("g-2");
  });

  it("rejects with friendly text for known codes, in the chosen language", async () => {
    mockFetch(() => json({ error: { code: "call_full", message: "call is full" } }, 409));
    const { result } = renderHook(() => useTeleJoin({ joinUrl: "/j", lang: "bn" }));
    let err: unknown;
    await act(async () => { err = await result.current.getJoin().catch((e: unknown) => e); });
    expect(err).toBeInstanceOf(TeleApiError);
    expect(err).toMatchObject({ code: "call_full", message: "কলটি পূর্ণ। একটু পরে আবার চেষ্টা করুন।", serverMessage: "call is full" });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(err);
  });

  it("keeps Tele's message when friendlyErrors is false or the code is unknown", async () => {
    mockFetch(() => json({ error: { code: "call_full", message: "call is full" } }, 409));
    const { result } = renderHook(() => useTeleJoin({ joinUrl: "/j", friendlyErrors: false }));
    await act(async () => { await result.current.getJoin().catch(() => {}); });
    expect(result.current.error?.message).toBe("call is full");

    mockFetch(() => json({ error: { code: "brand_new", message: "server says no" } }, 409));
    const r2 = renderHook(() => useTeleJoin({ joinUrl: "/j" }));
    await act(async () => { await r2.result.current.getJoin().catch(() => {}); });
    expect(r2.result.current.error?.message).toBe("server says no");
  });

  it("normalises plain error objects from a custom getJoin", async () => {
    const { result } = renderHook(() =>
      useTeleJoin({ getJoin: () => Promise.reject({ code: "not_invited", message: "x" }) }));
    await act(async () => { await result.current.getJoin().catch(() => {}); });
    expect(result.current.error).toBeInstanceOf(TeleApiError);
    expect(result.current.error?.message).toBe("You're not on the list for this call. Ask the host to add you.");
  });

  it("fails clearly without a source, and reset goes back to idle", async () => {
    const { result } = renderHook(() => useTeleJoin({}));
    await act(async () => { await result.current.getJoin().catch(() => {}); });
    expect(result.current.error?.message).toMatch(/joinUrl or getJoin/);
    act(() => result.current.reset());
    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(result.current.error).toBeNull();
  });

  it("ignores a stale attempt after reset", async () => {
    let resolve!: (j: typeof JOIN) => void;
    const { result } = renderHook(() => useTeleJoin({ getJoin: () => new Promise((r) => { resolve = r; }) }));
    let p!: Promise<unknown>;
    act(() => { p = result.current.getJoin(); });
    expect(result.current.status).toBe("joining");
    act(() => result.current.reset());
    await act(async () => { resolve(JOIN); await p; });
    expect(result.current.status).toBe("idle");
    expect(result.current.join).toBeNull();
  });
});
