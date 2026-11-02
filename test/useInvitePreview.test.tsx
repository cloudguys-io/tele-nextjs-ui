import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useInvitePreview } from "../src/useInvitePreview.js";
import { json, mockFetch, preview } from "./helpers.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useInvitePreview", () => {
  it("loads from the default URL", async () => {
    const f = mockFetch(() => json(preview()));
    const { result } = renderHook(() => useInvitePreview("q3V9 x"));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.canJoin).toBe(true);
    expect(result.current.preview?.call.title).toBe("Design review");
    expect(f.mock.calls[0]![0]).toBe("/api/tele/invites/q3V9%20x");
  });

  it("uses a custom URL template and init", async () => {
    const f = mockFetch(() => json(preview({ can_join_now: false, reason: { code: "not_invited", message: "m" } })));
    const { result } = renderHook(() => useInvitePreview("abc", { previewUrl: "/b/preview?code={code}", init: { headers: { "X-T": "1" } } }));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.canJoin).toBe(false);
    expect(f.mock.calls[0]![0]).toBe("/b/preview?code=abc");
    expect(f.mock.calls[0]![1]!.headers).toMatchObject({ "X-T": "1" });
  });

  it("reports errors and reloads", async () => {
    let n = 0;
    mockFetch(() => (n++ === 0 ? json({ error: { code: "invite_not_found", message: "invite not found" } }, 404) : json(preview())));
    const { result } = renderHook(() => useInvitePreview("bad"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatchObject({ code: "invite_not_found", status: 404 });
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.error).toBeNull();
  });

  it("rejects a malformed preview", async () => {
    mockFetch(() => json({ nope: true }));
    const { result } = renderHook(() => useInvitePreview("x"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatchObject({ code: "bad_response" });
  });

  it("does not fetch when given an initial preview", async () => {
    const f = mockFetch(() => json(preview()));
    const { result } = renderHook(() => useInvitePreview("x", { initial: preview() }));
    expect(result.current.status).toBe("ready");
    await new Promise((r) => setTimeout(r, 10));
    expect(f).not.toHaveBeenCalled();
  });

  it("reloads when a too_early call opens", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const opensAt = new Date(Date.now() + 5_000).toISOString();
    let n = 0;
    const f = mockFetch(() =>
      json(n++ === 0 ? preview({ can_join_now: false, reason: { code: "too_early", message: "m", opens_at: opensAt } }) : preview()));
    const { result } = renderHook(() => useInvitePreview("soon"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.canJoin).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(6_000); });
    await waitFor(() => expect(result.current.canJoin).toBe(true));
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("starts over when the code changes", async () => {
    mockFetch((url) => json(preview({ call: { ...preview().call, title: url.endsWith("b") ? "B" : "A" } })));
    const { result, rerender } = renderHook(({ code }) => useInvitePreview(code), { initialProps: { code: "a" } });
    await waitFor(() => expect(result.current.preview?.call.title).toBe("A"));
    rerender({ code: "b" });
    expect(result.current.status).toBe("loading");
    expect(result.current.preview).toBeNull();
    await waitFor(() => expect(result.current.preview?.call.title).toBe("B"));
  });
});
