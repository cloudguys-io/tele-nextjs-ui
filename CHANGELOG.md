# Changelog

## 0.2.0

Follows the v0.2.0 shared backend routes. Tele now accepts service-token invite joins that carry the end user's
IP, and its API allows any origin.

- Both join routes are now documented as service-token joins carrying the person's IP and user agent, so Tele
  records the person's own IP for invite joins too. The README no longer says browsers can't call Tele or that
  invite joins record the backend's IP.
- New in the README: a `getJoin` may call Tele directly with a user token from `/api/tele/token` (with
  `credentials: "omit"`). The backend routes stay the default.
- Example: the dev proxy's `/api/tele/invites/{code}/join` is a service-token join with the person's IP and
  user agent, like `/api/tele/calls/{id}/join`.
- No API changes to the components, hooks or helpers.

## 0.1.0

First release.

- `<TeleCallRoom>`: `<TeleCall>` from `@tele/call-ui` 0.2 (tested with v0.2.1) for the App Router. Join through `joinUrl` or `getJoin`; chat history, diagnostics, recording and "End for all" from endpoint URL templates (`{callId}`, `{action}`) or functions; `onLeave` defaults to `router.push(leaveHref)`; friendly join errors in English and Bangla; `renderError`; a `controls` slot; a `ref` prop (React 19) with `leave`, `setMicrophone`, `setCamera`, `phase` and `element`.
- `<TeleInvitePreview>`: the invite card for `GET /v1/invites/{code}`, with host, title, schedule, a message for every `reason.code`, a countdown for `too_early` that refreshes when the call opens (retrying with backoff if the reader's clock runs ahead), times in the reader's time zone filled in after hydration, and a Join button or link.
- `<TeleJoinPage>`: preview, then room, for `app/call/[code]/page.tsx`. Every prop can come from a server component.
- Hooks `useTeleJoin` and `useInvitePreview`; helpers `createJoinFetcher`, `createChatHistoryLoader`, `createDiagnosticsReporter`, `createRecordingToggle`, `createEndForAll`, `fetchInvitePreview`, `fillUrl`, `TeleApiError`, `errorFromResponse`, `asTeleError`, `reasonMessage` and `resolveTheme`.
- Follows the shared Tele backend routes: `DEFAULT_PREVIEW_URL`, `DEFAULT_JOIN_URL`, `DEFAULT_CALL_JOIN_URL`, `DEFAULT_CHAT_HISTORY_URL`, `DEFAULT_DIAGNOSTICS_URL`. `<TeleJoinPage>` joins through the invite once, then rejoins through the call-id route (`rejoinUrl`), which carries the person's IP. Friendly en/bn text for the backend's `unauthenticated` and `upstream_*` errors.
- `fetchInit` is the one name for extra fetch options on every component and hook.
- `next/navigation.js` and `next/link.js` imports, so `dist/` also loads under plain Node ESM.
- Theming with the `--tele-*` variables through a `theme` object, `className` or `style`.
- Types for the join response, invite preview, Tele errors and every `<tele-call>` event.
