import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { JOIN, json, mockFetch } from "./helpers.js";
import { calls, last } from "./fake-tele-call.js";
import type { TeleCallRoomHandle as Handle } from "../src/TeleCallRoom.js";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation.js", () => ({ useRouter: () => router }));
vi.mock("@tele/call-ui/react", () => import("./fake-tele-call.js"));

const { TeleCallRoom } = await import("../src/TeleCallRoom.js");

beforeEach(() => {
  calls.length = 0;
  router.push.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TeleCallRoom", () => {
  it("passes attributes, theme mode and theme variables to TeleCall", () => {
    render(
      <TeleCallRoom
        joinUrl="/api/join"
        features={["lobby", "chat"]}
        lang="bn"
        layout="speaker"
        strings={{ exit: "Back" }}
        theme={{ mode: "dark", accent: "#0a7cff" }}
        style={{ height: "100dvh" }}
        className="room"
      />,
    );
    const p = last().props;
    expect(p).toMatchObject({ features: ["lobby", "chat"], lang: "bn", layout: "speaker", theme: "dark", strings: { exit: "Back" }, className: "room" });
    expect(p.style).toEqual({ "--tele-accent": "#0a7cff", height: "100dvh" });
    const el = document.querySelector("tele-call")!;
    expect(el.getAttribute("theme")).toBe("dark");
    expect(el.getAttribute("features")).toBe("lobby chat");
  });

  it("getJoin POSTs to joinUrl and the endpoint URLs use the joined call id", async () => {
    const f = mockFetch((url) => (url === "/api/join" ? json(JOIN) : url.endsWith("/messages") ? json({ messages: [] }) : new Response(null, { status: 204 })));
    render(
      <TeleCallRoom
        joinUrl="/api/join"
        fetchInit={{ headers: { "X-Csrf": "t" } }}
        chatHistoryUrl="/api/calls/{callId}/messages"
        diagnosticsUrl="/api/calls/{callId}/diagnostics"
        recordingUrl="/api/calls/{callId}/recording/{action}"
        endForAllUrl="/api/calls/{callId}/end"
      />,
    );
    const p = last().props;
    await act(async () => { await expect(p.getJoin()).resolves.toEqual(JOIN); });
    await p.loadChatHistory!("call-1");
    await p.reportDiagnostic!("connected", { grant_id: "g", participant_sid: "PA", kind: "connected", payload: {} });
    await p.setRecording!(true);
    await p.endForAll!();
    expect(f.mock.calls.map((c) => `${c[1]!.method} ${c[0]}`)).toEqual([
      "POST /api/join",
      "GET /api/calls/call-1/messages",
      "POST /api/calls/call-1/diagnostics",
      "POST /api/calls/call-1/recording/start",
      "POST /api/calls/call-1/end",
    ]);
    for (const c of f.mock.calls) expect(c[1]!.headers).toMatchObject({ "X-Csrf": "t" });
  });

  it("prefers function props over endpoint URLs", () => {
    const loadChatHistory = vi.fn();
    const setRecording = vi.fn();
    const endForAll = vi.fn();
    const reportDiagnostic = vi.fn();
    const getJoin = vi.fn(async () => JOIN);
    render(<TeleCallRoom getJoin={getJoin} loadChatHistory={loadChatHistory} chatHistoryUrl="/x" setRecording={setRecording}
      endForAll={endForAll} reportDiagnostic={reportDiagnostic} />);
    const p = last().props;
    expect(p.loadChatHistory).toBe(loadChatHistory);
    expect(p.setRecording).toBe(setRecording);
    expect(p.endForAll).toBe(endForAll);
    expect(p.reportDiagnostic).toBe(reportDiagnostic);
  });

  it("leaves no host functions when no endpoint is given", () => {
    render(<TeleCallRoom joinUrl="/j" />);
    const p = last().props;
    expect(p.setRecording).toBeUndefined();
    expect(p.endForAll).toBeUndefined();
    expect(p.loadChatHistory).toBeUndefined();
    expect(p.reportDiagnostic).toBeUndefined();
  });

  it("navigates to leaveHref on leave by default", () => {
    render(<TeleCallRoom joinUrl="/j" leaveHref="/calls" />);
    act(() => last().props.onLeave!({ reason: "left" }));
    expect(router.push).toHaveBeenCalledWith("/calls");
  });

  it("navigates to / without leaveHref, and onLeave replaces navigation", () => {
    render(<TeleCallRoom joinUrl="/j" />);
    act(() => last().props.onLeave!({ reason: "room_deleted" }));
    expect(router.push).toHaveBeenCalledWith("/");
    cleanup();
    router.push.mockReset();
    const onLeave = vi.fn();
    render(<TeleCallRoom joinUrl="/j" leaveHref="/x" onLeave={onLeave} />);
    act(() => last().props.onLeave!({ reason: "left" }));
    expect(onLeave).toHaveBeenCalledWith({ reason: "left" });
    expect(router.push).not.toHaveBeenCalled();
  });

  it("forwards the other events", () => {
    const onJoined = vi.fn(), onError = vi.fn(), onParticipant = vi.fn(), onChat = vi.fn();
    render(<TeleCallRoom joinUrl="/j" onJoined={onJoined} onError={onError} onParticipant={onParticipant} onChat={onChat} />);
    const p = last().props;
    p.onJoined!({ call: JOIN.call, role: "host", grantId: "g" });
    p.onError!({ code: "x", message: "m" });
    p.onParticipant!({ action: "joined", identity: "u", name: "U", count: 2 });
    p.onChat!({ id: "1", userId: "u", name: "U", body: "hi", mine: false });
    expect([onJoined, onError, onParticipant, onChat].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
  });

  it("gives the element friendly error text", async () => {
    mockFetch(() => json({ error: { code: "not_invited", message: "you are not on the participant list for this call" } }, 403));
    render(<TeleCallRoom joinUrl="/j" />);
    const err = await last().props.getJoin().catch((e: unknown) => e);
    expect(err).toMatchObject({ code: "not_invited", message: "You're not on the list for this call. Ask the host to add you." });
  });

  it("renders renderError instead of the element, and retry remounts it", async () => {
    let fail = true;
    mockFetch(() => (fail ? json({ error: { code: "call_full", message: "full" } }, 409) : json(JOIN)));
    render(
      <TeleCallRoom
        joinUrl="/j"
        renderError={(e, retry) => <div><p role="alert">{e.message}</p><button onClick={retry}>again</button></div>}
      />,
    );
    await act(async () => { await last().props.getJoin().catch(() => {}); });
    expect(screen.getByRole("alert").textContent).toBe("This call is full. Try again in a moment.");
    expect(document.querySelector("tele-call")).toBeNull();
    fail = false;
    act(() => screen.getByText("again").click());
    await waitFor(() => expect(document.querySelector("tele-call")).not.toBeNull());
    await act(async () => { await expect(last().props.getJoin()).resolves.toEqual(JOIN); });
  });

  it("exposes leave, setMicrophone, setCamera, phase and element through the ref", async () => {
    const ref = createRef<Handle>();
    render(<TeleCallRoom ref={ref} joinUrl="/j" onLeave={() => {}} />);
    await waitFor(() => expect(ref.current?.element).not.toBeNull());
    expect(ref.current!.phase).toBe("lobby");
    await ref.current!.setMicrophone(false);
    await ref.current!.setCamera(true);
    const el = ref.current!.element as unknown as HTMLElement;
    expect(el.dataset).toMatchObject({ mic: "false", cam: "true" });
    await act(async () => { await ref.current!.leave(); });
    expect(ref.current!.phase).toBe("left");
  });

  it("puts controls into the element's controls slot", async () => {
    render(<TeleCallRoom joinUrl="/j" controls={<button>Raise hand</button>} />);
    await waitFor(() => expect(screen.getByText("Raise hand")).toBeTruthy());
    const wrapper = screen.getByText("Raise hand").parentElement!;
    expect(wrapper.getAttribute("slot")).toBe("controls");
    expect(wrapper.parentElement!.tagName.toLowerCase()).toBe("tele-call");
  });

  it("throws without a join source", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TeleCallRoom {...({} as { joinUrl: string })} />)).toThrow(/joinUrl or getJoin/);
  });
});
