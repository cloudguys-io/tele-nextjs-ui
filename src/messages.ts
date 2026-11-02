// Friendly text for invite previews and join errors, in English and Bangla. No em or en dashes.
import type { Lang } from "./types.js";

const en = {
  loading: "Checking the invite...",
  invitedBy: "{host} invited you to",
  instantCall: "Instant call",
  timeRange: "{start} to {end}",
  startsAt: "Starts {start}",
  openNow: "The call is open.",
  opensIn: "Opens in {countdown}",
  join: "Join the call",
  retry: "Try again",
  too_early: "This call opens at {time}.",
  too_early_soon: "This call isn't open yet.",
  too_late: "This call has ended.",
  call_ended: "This call has ended.",
  call_cancelled: "This call was cancelled.",
  not_invited: "You're not on the list for this call. Ask the host to add you.",
  invite_expired: "This link is no longer valid.",
  invite_revoked: "This link is no longer valid.",
  invite_exhausted: "This link is no longer valid.",
  invite_not_found: "This invite link isn't valid.",
  not_found: "This call doesn't exist or isn't visible to you.",
  call_full: "This call is full. Try again in a moment.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  unauthenticated: "Your session has expired. Sign in again.",
  forbidden: "You can't join this call.",
  network_error: "Couldn't reach the server. Check your connection and try again.",
  fallback: "Couldn't load this call.",
};

/** Every label used by the invite preview and join page. Placeholders look like `{name}`. */
export type InviteStrings = typeof en;

const bn: InviteStrings = {
  loading: "আমন্ত্রণ যাচাই করা হচ্ছে...",
  invitedBy: "{host} আপনাকে আমন্ত্রণ জানিয়েছেন",
  instantCall: "তাৎক্ষণিক কল",
  timeRange: "{start} থেকে {end}",
  startsAt: "শুরু {start}",
  openNow: "কলটি এখন খোলা।",
  opensIn: "{countdown} পরে খুলবে",
  join: "কলে যোগ দিন",
  retry: "আবার চেষ্টা করুন",
  too_early: "এই কলটি {time} এ খুলবে।",
  too_early_soon: "এই কলটি এখনো খোলেনি।",
  too_late: "এই কলটি শেষ হয়ে গেছে।",
  call_ended: "এই কলটি শেষ হয়ে গেছে।",
  call_cancelled: "এই কলটি বাতিল করা হয়েছে।",
  not_invited: "এই কলের তালিকায় আপনার নাম নেই। আপনাকে যোগ করতে হোস্টকে বলুন।",
  invite_expired: "এই লিংকটি আর বৈধ নয়।",
  invite_revoked: "এই লিংকটি আর বৈধ নয়।",
  invite_exhausted: "এই লিংকটি আর বৈধ নয়।",
  invite_not_found: "এই আমন্ত্রণ লিংকটি সঠিক নয়।",
  not_found: "এই কলটি নেই, অথবা আপনি এটি দেখতে পারবেন না।",
  call_full: "কলটি পূর্ণ। একটু পরে আবার চেষ্টা করুন।",
  rate_limited: "অনেকবার চেষ্টা করা হয়েছে। এক মিনিট অপেক্ষা করে আবার চেষ্টা করুন।",
  unauthenticated: "আপনার সেশনের মেয়াদ শেষ। আবার সাইন ইন করুন।",
  forbidden: "আপনি এই কলে যোগ দিতে পারবেন না।",
  network_error: "সার্ভারে পৌঁছানো যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।",
  fallback: "কলটি লোড করা যায়নি।",
};

export const INVITE_STRINGS: Record<Lang, InviteStrings> = { en, bn };

/** `bn-BD` -> `bn`; anything unknown -> `en`. */
export function resolveLang(lang: string | null | undefined): Lang {
  const base = (lang ?? "").split("-")[0]?.toLowerCase();
  return base === "bn" ? "bn" : "en";
}

/** The dictionary for `lang` with per-key overrides applied. */
export function inviteStrings(lang?: string | null, overrides?: Partial<InviteStrings>): InviteStrings {
  const base = INVITE_STRINGS[resolveLang(lang)];
  return overrides ? { ...base, ...overrides } : base;
}

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** A date and time in the reader's time zone, in the chosen language. */
export function formatTime(iso: string, lang?: string | null): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(resolveLang(lang) === "bn" ? "bn-BD" : "en", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/** `01:02:03` style countdown for a number of seconds; hours are dropped below one hour. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const body = `${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return h > 0 ? `${pad(h)}:${body}` : body;
}

const CODES = new Set<string>([
  "too_late", "call_ended", "call_cancelled", "not_invited", "invite_expired", "invite_revoked", "invite_exhausted",
  "invite_not_found", "not_found", "call_full", "rate_limited", "unauthenticated", "forbidden", "network_error",
]);

/**
 * Friendly text for a Tele error or denial code, such as `not_invited` or `too_early`.
 * Returns `undefined` for codes without built-in text, so callers can fall back to the server's message.
 */
export function reasonMessage(
  code: string | null | undefined,
  opts: { lang?: string | null; opensAt?: string | null; strings?: Partial<InviteStrings> } = {},
): string | undefined {
  if (!code) return undefined;
  const s = inviteStrings(opts.lang, opts.strings);
  if (code === "too_early") return opts.opensAt ? format(s.too_early, { time: formatTime(opts.opensAt, opts.lang) }) : s.too_early_soon;
  return CODES.has(code) ? s[code as keyof InviteStrings] : undefined;
}
