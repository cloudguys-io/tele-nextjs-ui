"use client";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { DEFAULT_CALL_JOIN_URL, DEFAULT_JOIN_URL, fillUrl } from "./fetchers.js";
import { CSS, STYLE_HREF } from "./styles.js";
import { TeleCallRoom } from "./TeleCallRoom.js";
import { TeleInvitePreview } from "./TeleInvitePreview.js";
import { resolveTheme } from "./theme.js";
function TeleJoinPage(props) {
  const {
    code,
    previewUrl,
    joinUrl = DEFAULT_JOIN_URL,
    rejoinUrl = DEFAULT_CALL_JOIN_URL,
    preview,
    inviteStrings,
    previewExtra,
    previewClassName,
    previewStyle,
    onJoinClick,
    className,
    style,
    ...room
  } = props;
  const [joining, setJoining] = useState(false);
  if (joining) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("style", { href: STYLE_HREF, precedence: "default", children: CSS }),
      /* @__PURE__ */ jsx(
        TeleCallRoom,
        {
          ...room,
          joinUrl: fillUrl(joinUrl, { code }),
          rejoinUrl: rejoinUrl === false ? void 0 : rejoinUrl,
          errorStrings: inviteStrings,
          className: ["tele-room", className].filter(Boolean).join(" "),
          style
        }
      )
    ] });
  }
  const theme = resolveTheme(room.theme, previewStyle);
  return /* @__PURE__ */ jsxs("main", { className: ["tele-ui", "tele-page", previewClassName].filter(Boolean).join(" "), "data-theme": theme.mode, style: theme.style, children: [
    /* @__PURE__ */ jsx("style", { href: STYLE_HREF, precedence: "default", children: CSS }),
    /* @__PURE__ */ jsx(
      TeleInvitePreview,
      {
        code,
        previewUrl,
        fetchInit: room.fetchInit,
        preview,
        lang: room.lang,
        strings: inviteStrings,
        theme: room.theme,
        onJoin: (p) => {
          onJoinClick?.(p);
          setJoining(true);
        },
        children: previewExtra
      }
    )
  ] });
}
export {
  TeleJoinPage
};
