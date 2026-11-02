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
  fallback: "Couldn't load this call."
};
const bn = {
  loading: "\u0986\u09AE\u09A8\u09CD\u09A4\u09CD\u09B0\u09A3 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u099A\u09CD\u099B\u09C7...",
  invitedBy: "{host} \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u0986\u09AE\u09A8\u09CD\u09A4\u09CD\u09B0\u09A3 \u099C\u09BE\u09A8\u09BF\u09AF\u09BC\u09C7\u099B\u09C7\u09A8",
  instantCall: "\u09A4\u09BE\u09CE\u0995\u09CD\u09B7\u09A3\u09BF\u0995 \u0995\u09B2",
  timeRange: "{start} \u09A5\u09C7\u0995\u09C7 {end}",
  startsAt: "\u09B6\u09C1\u09B0\u09C1 {start}",
  openNow: "\u0995\u09B2\u099F\u09BF \u098F\u0996\u09A8 \u0996\u09CB\u09B2\u09BE\u0964",
  opensIn: "{countdown} \u09AA\u09B0\u09C7 \u0996\u09C1\u09B2\u09AC\u09C7",
  join: "\u0995\u09B2\u09C7 \u09AF\u09CB\u0997 \u09A6\u09BF\u09A8",
  retry: "\u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8",
  too_early: "\u098F\u0987 \u0995\u09B2\u099F\u09BF {time} \u098F \u0996\u09C1\u09B2\u09AC\u09C7\u0964",
  too_early_soon: "\u098F\u0987 \u0995\u09B2\u099F\u09BF \u098F\u0996\u09A8\u09CB \u0996\u09CB\u09B2\u09C7\u09A8\u09BF\u0964",
  too_late: "\u098F\u0987 \u0995\u09B2\u099F\u09BF \u09B6\u09C7\u09B7 \u09B9\u09AF\u09BC\u09C7 \u0997\u09C7\u099B\u09C7\u0964",
  call_ended: "\u098F\u0987 \u0995\u09B2\u099F\u09BF \u09B6\u09C7\u09B7 \u09B9\u09AF\u09BC\u09C7 \u0997\u09C7\u099B\u09C7\u0964",
  call_cancelled: "\u098F\u0987 \u0995\u09B2\u099F\u09BF \u09AC\u09BE\u09A4\u09BF\u09B2 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964",
  not_invited: "\u098F\u0987 \u0995\u09B2\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AF\u09BC \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BE\u09AE \u09A8\u09C7\u0987\u0964 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09AF\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u09B9\u09CB\u09B8\u09CD\u099F\u0995\u09C7 \u09AC\u09B2\u09C1\u09A8\u0964",
  invite_expired: "\u098F\u0987 \u09B2\u09BF\u0982\u0995\u099F\u09BF \u0986\u09B0 \u09AC\u09C8\u09A7 \u09A8\u09AF\u09BC\u0964",
  invite_revoked: "\u098F\u0987 \u09B2\u09BF\u0982\u0995\u099F\u09BF \u0986\u09B0 \u09AC\u09C8\u09A7 \u09A8\u09AF\u09BC\u0964",
  invite_exhausted: "\u098F\u0987 \u09B2\u09BF\u0982\u0995\u099F\u09BF \u0986\u09B0 \u09AC\u09C8\u09A7 \u09A8\u09AF\u09BC\u0964",
  invite_not_found: "\u098F\u0987 \u0986\u09AE\u09A8\u09CD\u09A4\u09CD\u09B0\u09A3 \u09B2\u09BF\u0982\u0995\u099F\u09BF \u09B8\u09A0\u09BF\u0995 \u09A8\u09AF\u09BC\u0964",
  not_found: "\u098F\u0987 \u0995\u09B2\u099F\u09BF \u09A8\u09C7\u0987, \u0985\u09A5\u09AC\u09BE \u0986\u09AA\u09A8\u09BF \u098F\u099F\u09BF \u09A6\u09C7\u0996\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964",
  call_full: "\u0995\u09B2\u099F\u09BF \u09AA\u09C2\u09B0\u09CD\u09A3\u0964 \u098F\u0995\u099F\u09C1 \u09AA\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964",
  rate_limited: "\u0985\u09A8\u09C7\u0995\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u098F\u0995 \u09AE\u09BF\u09A8\u09BF\u099F \u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964",
  unauthenticated: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09C7\u09B6\u09A8\u09C7\u09B0 \u09AE\u09C7\u09AF\u09BC\u09BE\u09A6 \u09B6\u09C7\u09B7\u0964 \u0986\u09AC\u09BE\u09B0 \u09B8\u09BE\u0987\u09A8 \u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
  forbidden: "\u0986\u09AA\u09A8\u09BF \u098F\u0987 \u0995\u09B2\u09C7 \u09AF\u09CB\u0997 \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964",
  network_error: "\u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0\u09C7 \u09AA\u09CC\u0981\u099B\u09BE\u09A8\u09CB \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09A8\u09C7\u099F \u09B8\u0982\u09AF\u09CB\u0997 \u09A6\u09C7\u0996\u09C7 \u0986\u09AC\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8\u0964",
  fallback: "\u0995\u09B2\u099F\u09BF \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964"
};
const INVITE_STRINGS = { en, bn };
function resolveLang(lang) {
  const base = (lang ?? "").split("-")[0]?.toLowerCase();
  return base === "bn" ? "bn" : "en";
}
function inviteStrings(lang, overrides) {
  const base = INVITE_STRINGS[resolveLang(lang)];
  return overrides ? { ...base, ...overrides } : base;
}
function format(template, vars) {
  return template.replace(/\{(\w+)\}/g, (m, k) => k in vars ? String(vars[k]) : m);
}
function formatTime(iso, lang) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(resolveLang(lang) === "bn" ? "bn-BD" : "en", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const pad = (n) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const body = `${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
  return h > 0 ? `${pad(h)}:${body}` : body;
}
const CODES = /* @__PURE__ */ new Set([
  "too_late",
  "call_ended",
  "call_cancelled",
  "not_invited",
  "invite_expired",
  "invite_revoked",
  "invite_exhausted",
  "invite_not_found",
  "not_found",
  "call_full",
  "rate_limited",
  "unauthenticated",
  "forbidden",
  "network_error"
]);
function reasonMessage(code, opts = {}) {
  if (!code) return void 0;
  const s = inviteStrings(opts.lang, opts.strings);
  if (code === "too_early") return opts.opensAt ? format(s.too_early, { time: formatTime(opts.opensAt, opts.lang) }) : s.too_early_soon;
  return CODES.has(code) ? s[code] : void 0;
}
export {
  INVITE_STRINGS,
  format,
  formatCountdown,
  formatTime,
  inviteStrings,
  reasonMessage,
  resolveLang
};
