import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { TeleInvitePreview } from "../src/TeleInvitePreview.js";
import { formatTime } from "../src/messages.js";
import { json, mockFetch, preview } from "./helpers.js";

vi.mock("next/link.js", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("TeleInvitePreview", () => {
  it("shows loading, then host, title, time and an enabled Join", async () => {
    mockFetch(() => json(preview()));
    const onJoin = vi.fn();
    const { container } = render(<TeleInvitePreview code="abc" onJoin={onJoin} />);
    expect(screen.getByRole("status").textContent).toBe("Checking the invite...");
    await screen.findByRole("heading", { name: "Design review" });
    expect(screen.getByText("Rahim invited you to")).toBeTruthy();
    const time = container.querySelector(".tele-card__time")!;
    expect(time.textContent).toBe(`${formatTime("2026-10-20T04:00:00Z")} to ${formatTime("2026-10-20T04:45:00Z")}`);
    expect([...time.querySelectorAll("time")].map((t) => t.getAttribute("datetime"))).toEqual(["2026-10-20T04:00:00Z", "2026-10-20T04:45:00Z"]);
    expect(screen.getByRole("status").textContent).toBe("The call is open.");
    const join = screen.getByRole("button", { name: "Join the call" }) as HTMLButtonElement;
    expect(join.disabled).toBe(false);
    join.click();
    expect(onJoin).toHaveBeenCalledWith(expect.objectContaining({ can_join_now: true }));
  });

  it("says Instant call without a schedule", async () => {
    mockFetch(() => json(preview({ call: { ...preview().call, scheduled_start: null, scheduled_end: null } })));
    render(<TeleInvitePreview code="abc" />);
    expect(await screen.findByText("Instant call")).toBeTruthy();
  });

  it.each([
    ["not_invited", "You're not on the list for this call. Ask the host to add you."],
    ["call_cancelled", "This call was cancelled."],
    ["too_late", "This call has ended."],
    ["call_ended", "This call has ended."],
    ["invite_expired", "This link is no longer valid."],
    ["invite_revoked", "This link is no longer valid."],
    ["invite_exhausted", "This link is no longer valid."],
  ])("explains %s and disables Join", async (code, text) => {
    mockFetch(() => json(preview({ can_join_now: false, reason: { code, message: "server text" } })));
    render(<TeleInvitePreview code="abc" />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe(text));
    expect(screen.getByRole("status").dataset.reason).toBe(code);
    expect((screen.getByRole("button", { name: "Join the call" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("speaks Bangla", async () => {
    mockFetch(() => json(preview({ can_join_now: false, reason: { code: "not_invited", message: "x" } })));
    render(<TeleInvitePreview code="abc" lang="bn" />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("এই কলের তালিকায় আপনার নাম নেই। আপনাকে যোগ করতে হোস্টকে বলুন।"));
    expect(screen.getByText("Rahim আপনাকে আমন্ত্রণ জানিয়েছেন")).toBeTruthy();
    expect(screen.getByRole("button", { name: "কলে যোগ দিন" })).toBeTruthy();
  });

  it("falls back to the server message for unknown reasons", async () => {
    mockFetch(() => json(preview({ can_join_now: false, reason: { code: "new_rule", message: "server explains" } })));
    render(<TeleInvitePreview code="abc" />);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("server explains"));
  });

  it("counts down to a too_early call", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const opensAt = new Date(Date.now() + 65_000).toISOString();
    mockFetch(() => json(preview({ can_join_now: false, reason: { code: "too_early", message: "m", opens_at: opensAt } })));
    render(<TeleInvitePreview code="abc" />);
    await screen.findByText(/^Opens in 01:0[45]$/);
    expect(screen.getByRole("status").textContent).toBe(`This call opens at ${formatTime(opensAt)}.`);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByText(/^Opens in 00:5[45]$/)).toBeTruthy();
  });

  it("shows invalid links with a retry", async () => {
    let n = 0;
    mockFetch(() => (n++ === 0 ? json({ error: { code: "invite_not_found", message: "invite not found" } }, 404) : json(preview())));
    render(<TeleInvitePreview code="nope" />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("This invite link isn't valid."));
    screen.getByRole("button", { name: "Try again" }).click();
    await screen.findByRole("heading", { name: "Design review" });
  });

  it("explains bad_response and internal errors", async () => {
    mockFetch(() => new Response("oops", { status: 502 }));
    render(<TeleInvitePreview code="x" />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("The server sent an answer we couldn't read. Try again."));
    cleanup();
    mockFetch(() => json({ error: { code: "internal", message: "boom" } }, 500));
    render(<TeleInvitePreview code="x" lang="bn" />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("আমাদের দিকে একটি সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।"));
  });

  it("shows the error's own message for unknown codes", async () => {
    mockFetch(() => json({ error: { code: "brand_new", message: "Tele explains it" } }, 409));
    render(<TeleInvitePreview code="x" />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Tele explains it"));
  });

  it("renders Join as a link with joinHref", async () => {
    mockFetch(() => json(preview()));
    render(<TeleInvitePreview code="a b" joinHref="/room/{callId}?code={code}" />);
    const link = await screen.findByRole("link", { name: "Join the call" });
    expect(link.getAttribute("href")).toBe("/room/call-1?code=a%20b");
  });

  it("renders a disabled link while the call can't be joined", async () => {
    mockFetch(() => json(preview({ can_join_now: false, reason: { code: "call_ended", message: "m" } })));
    render(<TeleInvitePreview code="a" joinHref="/room/{callId}" />);
    const link = await screen.findByRole("link", { name: "Join the call" });
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.getAttribute("href")).toBeNull();
  });

  it("uses a given preview, children, labels and theme variables", () => {
    const f = mockFetch(() => json(preview()));
    const { container } = render(
      <TeleInvitePreview code="a" preview={preview()} strings={{ join: "Enter" }} theme={{ mode: "dark", accent: "red" }} className="mine">
        <p>Recorded</p>
      </TeleInvitePreview>,
    );
    expect(f).not.toHaveBeenCalled();
    expect(screen.getByText("Recorded")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enter" })).toBeTruthy();
    const section = container.querySelector("section")!;
    expect(section.className).toBe("tele-ui tele-card mine");
    expect(section.dataset.theme).toBe("dark");
    expect(section.style.getPropertyValue("--tele-accent")).toBe("red");
  });
});
