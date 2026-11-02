"use client";
// <TeleInvitePreview>: the card people see when they open an invite link. It loads the preview from your
// backend, says whether they can join now (with a countdown for calls that open later) and offers Join.
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { fillUrl } from "./fetchers.js";
import { format, formatCountdown, formatTime, inviteStrings, reasonMessage, type InviteStrings } from "./messages.js";
import { CSS, STYLE_HREF } from "./styles.js";
import { resolveTheme, type ThemeProp } from "./theme.js";
import type { InvitePreview } from "./types.js";
import { useInvitePreview } from "./useInvitePreview.js";

export type TeleInvitePreviewProps = {
  /** The invite code from the link. */
  code: string;
  /** Your endpoint for `GET /v1/invites/{code}`. Default `/api/tele/invites/{code}`. */
  previewUrl?: string;
  /** Extra fetch options, such as headers. */
  fetchInit?: RequestInit;
  /** A preview you already have (for example, fetched in a server component). Skips the first fetch. */
  preview?: InvitePreview;
  /** Called when Join is pressed. */
  onJoin?: (preview: InvitePreview) => void;
  /** Or make Join a link. `{code}` and `{callId}` are filled in. Used when `onJoin` is not set. */
  joinHref?: string;
  /** `en` or `bn`. Default `en`. */
  lang?: string;
  /** Label overrides. */
  strings?: Partial<InviteStrings>;
  /** `light`, `dark`, `auto`, or an object of `--tele-*` values plus `mode`. */
  theme?: ThemeProp;
  /** Shown under the title, for example a note about recording. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function TeleInvitePreview(props: TeleInvitePreviewProps) {
  const { code, lang } = props;
  const s = inviteStrings(lang, props.strings);
  const state = useInvitePreview(code, { previewUrl: props.previewUrl, init: props.fetchInit, initial: props.preview });
  const { preview, error } = state;
  const now = useNow(preview?.reason?.code === "too_early" && !!preview.reason.opens_at);
  const { mode, style } = resolveTheme(props.theme, props.style);

  let body: ReactNode;
  if (preview) {
    const c = preview.call;
    const opensAt = preview.reason?.code === "too_early" ? preview.reason.opens_at : undefined;
    const left = opensAt && now !== null ? Math.max(0, (new Date(opensAt).getTime() - now) / 1000) : null;
    const time = c.scheduled_start
      ? c.scheduled_end
        ? format(s.timeRange, { start: formatTime(c.scheduled_start, lang), end: formatTime(c.scheduled_end, lang) })
        : format(s.startsAt, { start: formatTime(c.scheduled_start, lang) })
      : s.instantCall;
    const notice = state.canJoin
      ? s.openNow
      : reasonMessage(preview.reason?.code, { lang, opensAt, strings: props.strings }) ?? preview.reason?.message ?? s.fallback;
    const joinHref = props.joinHref && !props.onJoin ? fillUrl(props.joinHref, { code, callId: c.id }) : null;
    body = (
      <>
        {c.host?.name ? <p className="tele-card__eyebrow">{format(s.invitedBy, { host: c.host.name })}</p> : null}
        <h1 className="tele-card__title">{c.title}</h1>
        <p className="tele-card__time" suppressHydrationWarning>{time}</p>
        {props.children}
        <p className="tele-card__notice" role="status" data-reason={state.canJoin ? undefined : preview.reason?.code} suppressHydrationWarning>
          {notice}
        </p>
        {left !== null && left > 0 ? (
          <p className="tele-card__countdown" aria-live="off" suppressHydrationWarning>
            {format(s.opensIn, { countdown: formatCountdown(left) })}
          </p>
        ) : null}
        <div className="tele-card__actions">
          {joinHref ? (
            state.canJoin ? (
              <Link className="tele-btn" href={joinHref}>{s.join}</Link>
            ) : (
              <span className="tele-btn" role="link" aria-disabled="true">{s.join}</span>
            )
          ) : (
            <button type="button" className="tele-btn" disabled={!state.canJoin} onClick={() => props.onJoin?.(preview)}>
              {s.join}
            </button>
          )}
        </div>
      </>
    );
  } else if (state.status === "error" && error) {
    const code = (error as { code?: string }).code;
    body = (
      <>
        <p className="tele-card__notice" role="alert" data-reason={code}>
          {reasonMessage(code, { lang, strings: props.strings }) ?? s.fallback}
        </p>
        <div className="tele-card__actions">
          <button type="button" className="tele-btn tele-btn--quiet" onClick={state.reload}>{s.retry}</button>
        </div>
      </>
    );
  } else {
    body = <p className="tele-card__status" role="status">{s.loading}</p>;
  }

  return (
    <section className={["tele-ui", "tele-card", props.className].filter(Boolean).join(" ")} data-theme={mode} style={style} aria-busy={state.status === "loading"}>
      <style href={STYLE_HREF} precedence="default">{CSS}</style>
      {body}
    </section>
  );
}

// The current time, ticking every second while `on`. null on the server and before the first effect.
function useNow(on: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!on) return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [on]);
  return now;
}
