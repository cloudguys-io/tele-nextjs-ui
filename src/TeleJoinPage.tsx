"use client";
// <TeleJoinPage>: everything an `app/call/[code]/page.tsx` needs. It shows the invite preview, and once the
// person presses Join, the call room (with its own lobby for camera and microphone).
import { useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_JOIN_URL, fillUrl } from "./fetchers.js";
import type { InviteStrings } from "./messages.js";
import { CSS, STYLE_HREF } from "./styles.js";
import { TeleCallRoom, type TeleCallRoomProps } from "./TeleCallRoom.js";
import { TeleInvitePreview } from "./TeleInvitePreview.js";
import { resolveTheme } from "./theme.js";
import type { InvitePreview } from "./types.js";

export type TeleJoinPageProps = Omit<TeleCallRoomProps, "joinUrl" | "getJoin" | "errorStrings"> & {
  /** The invite code from the route, for example `params.code`. */
  code: string;
  /** Your endpoint for `GET /v1/invites/{code}`. Default `/api/tele/invites/{code}`. */
  previewUrl?: string;
  /** Your endpoint for `POST /v1/invites/{code}/join`. Default `/api/tele/invites/{code}/join`. */
  joinUrl?: string;
  /** A preview you already have. Skips the first fetch. */
  preview?: InvitePreview;
  /** Label overrides for the preview card and join errors. */
  inviteStrings?: Partial<InviteStrings>;
  /** Shown inside the preview card, under the title. */
  previewExtra?: ReactNode;
  /** Classes and style for the preview screen (the call room uses `className` and `style`). */
  previewClassName?: string;
  previewStyle?: CSSProperties;
  /** Called when the person presses Join, before the room mounts. */
  onJoinClick?: (preview: InvitePreview) => void;
};

export function TeleJoinPage(props: TeleJoinPageProps) {
  const {
    code, previewUrl, joinUrl = DEFAULT_JOIN_URL, preview, inviteStrings, previewExtra, previewClassName, previewStyle,
    onJoinClick, className, style, ...room
  } = props;
  const [joining, setJoining] = useState(false);

  if (joining) {
    return (
      <>
        <style href={STYLE_HREF} precedence="default">{CSS}</style>
        <TeleCallRoom
          {...room}
          joinUrl={fillUrl(joinUrl, { code })}
          errorStrings={inviteStrings}
          className={["tele-room", className].filter(Boolean).join(" ")}
          style={style}
        />
      </>
    );
  }

  const theme = resolveTheme(room.theme, previewStyle);
  return (
    <main className={["tele-ui", "tele-page", previewClassName].filter(Boolean).join(" ")} data-theme={theme.mode} style={theme.style}>
      <style href={STYLE_HREF} precedence="default">{CSS}</style>
      <TeleInvitePreview
        code={code}
        previewUrl={previewUrl}
        fetchInit={room.fetchInit}
        preview={preview}
        lang={room.lang}
        strings={inviteStrings}
        theme={room.theme}
        onJoin={(p) => {
          onJoinClick?.(p);
          setJoining(true);
        }}
      >
        {previewExtra}
      </TeleInvitePreview>
    </main>
  );
}
