import { describe, expect, it } from "vitest";
import { formatCountdown, formatTime, INVITE_STRINGS, inviteStrings, reasonMessage, resolveLang } from "../src/messages.js";

describe("messages", () => {
  it("resolves languages", () => {
    expect(resolveLang("bn-BD")).toBe("bn");
    expect(resolveLang("BN")).toBe("bn");
    expect(resolveLang("fr")).toBe("en");
    expect(resolveLang(undefined)).toBe("en");
  });

  it("has every key in both languages, without dashes", () => {
    expect(Object.keys(INVITE_STRINGS.bn).sort()).toEqual(Object.keys(INVITE_STRINGS.en).sort());
    for (const dict of Object.values(INVITE_STRINGS)) {
      for (const v of Object.values(dict)) expect(v).not.toMatch(/[–—]/);
    }
  });

  it("applies overrides", () => {
    expect(inviteStrings("en", { join: "Enter" }).join).toBe("Enter");
  });

  it("gives friendly text for every documented reason", () => {
    expect(reasonMessage("not_invited")).toBe("You're not on the list for this call. Ask the host to add you.");
    expect(reasonMessage("call_cancelled", { lang: "bn" })).toBe("এই কলটি বাতিল করা হয়েছে।");
    for (const c of ["too_late", "call_ended"]) expect(reasonMessage(c)).toBe("This call has ended.");
    for (const c of ["invite_expired", "invite_revoked", "invite_exhausted"]) expect(reasonMessage(c)).toBe("This link is no longer valid.");
    expect(reasonMessage("call_full")).toMatch(/full/);
    expect(reasonMessage("unauthenticated")).toBe("Your session has expired. Sign in again.");
    expect(reasonMessage("unauthenticated", { lang: "bn" })).toBe("আপনার সেশনের মেয়াদ শেষ। আবার সাইন ইন করুন।");
    for (const c of ["upstream_auth", "upstream_error", "upstream_timeout", "upstream_unreachable"]) {
      expect(reasonMessage(c)).toMatch(/call service/);
      expect(reasonMessage(c, { lang: "bn" })).toMatch(/কল সার্ভিস/);
    }
    expect(reasonMessage("something_new")).toBeUndefined();
    expect(reasonMessage(null)).toBeUndefined();
  });

  it("puts the opening time into too_early", () => {
    const at = "2026-10-20T03:50:00Z";
    expect(reasonMessage("too_early", { opensAt: at })).toBe(`This call opens at ${formatTime(at)}.`);
    expect(reasonMessage("too_early", { lang: "bn", opensAt: at })).toContain("এ খুলবে");
    expect(reasonMessage("too_early")).toBe("This call isn't open yet.");
  });

  it("formats times and countdowns", () => {
    expect(formatTime("not a date")).toBe("not a date");
    expect(formatTime("2026-10-20T03:50:00Z", "bn")).toMatch(/[০-৯]/);
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(3 * 3600 + 2)).toBe("03:00:02");
    expect(formatCountdown(-5)).toBe("00:00");
  });
});
