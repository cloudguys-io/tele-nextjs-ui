import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { JOIN, json, mockFetch, preview } from "./helpers.js";
import { calls, last } from "./fake-tele-call.js";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation.js", () => ({ useRouter: () => router }));
vi.mock("@tele/call-ui/react", () => import("./fake-tele-call.js"));

const { TeleJoinPage } = await import("../src/TeleJoinPage.js");

beforeEach(() => {
  calls.length = 0;
  router.push.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TeleJoinPage", () => {
  it("shows the preview, then the room joined through the invite", async () => {
    const f = mockFetch((url) => (url.endsWith("/join") ? json(JOIN) : json(preview())));
    const onJoinClick = vi.fn();
    render(<TeleJoinPage code="q3V9" lang="en" layout="speaker" leaveHref="/done" onJoinClick={onJoinClick}
      chatHistoryUrl="/api/tele/calls/{callId}/messages" theme={{ accent: "#0a7cff" }} />);
    await screen.findByRole("heading", { name: "Design review" });
    expect(document.querySelector("tele-call")).toBeNull();
    expect(document.querySelector("main")!.style.getPropertyValue("--tele-accent")).toBe("#0a7cff");

    act(() => screen.getByRole("button", { name: "Join the call" }).click());
    expect(onJoinClick).toHaveBeenCalled();
    const el = document.querySelector("tele-call")!;
    expect(el).not.toBeNull();
    expect(el.getAttribute("class")).toBe("tele-room");
    const p = last().props;
    expect(p.layout).toBe("speaker");
    expect(p.loadChatHistory).toBeTypeOf("function");
    await act(async () => { await p.getJoin(); });
    expect(f.mock.calls.map((c) => `${c[1]!.method} ${c[0]}`)).toEqual(["GET /api/tele/invites/q3V9", "POST /api/tele/invites/q3V9/join"]);

    act(() => p.onLeave!({ reason: "left" }));
    expect(router.push).toHaveBeenCalledWith("/done");
  });

  it("uses custom endpoints and an initial preview", async () => {
    const f = mockFetch(() => json(JOIN));
    render(<TeleJoinPage code="c d" preview={preview()} previewUrl="/x/{code}" joinUrl="/b/join?code={code}" className="tall" />);
    act(() => screen.getByRole("button", { name: "Join the call" }).click());
    await act(async () => { await last().props.getJoin(); });
    expect(f.mock.calls.map((c) => c[0])).toEqual(["/b/join?code=c%20d"]);
    expect(document.querySelector("tele-call")!.getAttribute("class")).toBe("tele-room tall");
  });

  it("shows join errors in the chosen language via inviteStrings", async () => {
    mockFetch(() => json({ error: { code: "call_full", message: "full" } }, 409));
    render(<TeleJoinPage code="c" preview={preview()} inviteStrings={{ call_full: "Room is full" }} />);
    act(() => screen.getByRole("button", { name: "Join the call" }).click());
    const err = await last().props.getJoin().catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "call_full", message: "Room is full" });
  });
});
