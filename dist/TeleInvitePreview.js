"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fillUrl } from "./fetchers.js";
import { format, formatCountdown, formatTime, inviteStrings, reasonMessage } from "./messages.js";
import { CSS, STYLE_HREF } from "./styles.js";
import { resolveTheme } from "./theme.js";
import { useInvitePreview } from "./useInvitePreview.js";
function TeleInvitePreview(props) {
  const { code, lang } = props;
  const s = inviteStrings(lang, props.strings);
  const state = useInvitePreview(code, { previewUrl: props.previewUrl, init: props.fetchInit, initial: props.preview });
  const { preview, error } = state;
  const now = useNow(preview?.reason?.code === "too_early" && !!preview.reason.opens_at);
  const { mode, style } = resolveTheme(props.theme, props.style);
  let body;
  if (preview) {
    const c = preview.call;
    const opensAt = preview.reason?.code === "too_early" ? preview.reason.opens_at : void 0;
    const left = opensAt && now !== null ? Math.max(0, (new Date(opensAt).getTime() - now) / 1e3) : null;
    const time = c.scheduled_start ? c.scheduled_end ? format(s.timeRange, { start: formatTime(c.scheduled_start, lang), end: formatTime(c.scheduled_end, lang) }) : format(s.startsAt, { start: formatTime(c.scheduled_start, lang) }) : s.instantCall;
    const notice = state.canJoin ? s.openNow : reasonMessage(preview.reason?.code, { lang, opensAt, strings: props.strings }) ?? preview.reason?.message ?? s.fallback;
    const joinHref = props.joinHref && !props.onJoin ? fillUrl(props.joinHref, { code, callId: c.id }) : null;
    body = /* @__PURE__ */ jsxs(Fragment, { children: [
      c.host?.name ? /* @__PURE__ */ jsx("p", { className: "tele-card__eyebrow", children: format(s.invitedBy, { host: c.host.name }) }) : null,
      /* @__PURE__ */ jsx("h1", { className: "tele-card__title", children: c.title }),
      /* @__PURE__ */ jsx("p", { className: "tele-card__time", suppressHydrationWarning: true, children: time }),
      props.children,
      /* @__PURE__ */ jsx("p", { className: "tele-card__notice", role: "status", "data-reason": state.canJoin ? void 0 : preview.reason?.code, suppressHydrationWarning: true, children: notice }),
      left !== null && left > 0 ? /* @__PURE__ */ jsx("p", { className: "tele-card__countdown", "aria-live": "off", suppressHydrationWarning: true, children: format(s.opensIn, { countdown: formatCountdown(left) }) }) : null,
      /* @__PURE__ */ jsx("div", { className: "tele-card__actions", children: joinHref ? state.canJoin ? /* @__PURE__ */ jsx(Link, { className: "tele-btn", href: joinHref, children: s.join }) : /* @__PURE__ */ jsx("span", { className: "tele-btn", role: "link", "aria-disabled": "true", children: s.join }) : /* @__PURE__ */ jsx("button", { type: "button", className: "tele-btn", disabled: !state.canJoin, onClick: () => props.onJoin?.(preview), children: s.join }) })
    ] });
  } else if (state.status === "error" && error) {
    const code2 = error.code;
    body = /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { className: "tele-card__notice", role: "alert", "data-reason": code2, children: reasonMessage(code2, { lang, strings: props.strings }) ?? s.fallback }),
      /* @__PURE__ */ jsx("div", { className: "tele-card__actions", children: /* @__PURE__ */ jsx("button", { type: "button", className: "tele-btn tele-btn--quiet", onClick: state.reload, children: s.retry }) })
    ] });
  } else {
    body = /* @__PURE__ */ jsx("p", { className: "tele-card__status", role: "status", children: s.loading });
  }
  return /* @__PURE__ */ jsxs("section", { className: ["tele-ui", "tele-card", props.className].filter(Boolean).join(" "), "data-theme": mode, style, "aria-busy": state.status === "loading", children: [
    /* @__PURE__ */ jsx("style", { href: STYLE_HREF, precedence: "default", children: CSS }),
    body
  ] });
}
function useNow(on) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!on) return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1e3);
    return () => clearInterval(t);
  }, [on]);
  return now;
}
export {
  TeleInvitePreview
};
