# Changelog

## 0.1.0

First release.

- `<TeleCallRoom>`: `<TeleCall>` from `@tele/call-ui` 0.2.0 for the App Router. Join through `joinUrl` or `getJoin`; chat history, diagnostics, recording and "End for all" from endpoint URL templates (`{callId}`, `{action}`) or functions; `onLeave` defaults to `router.push(leaveHref)`; friendly join errors in English and Bangla; `renderError`; a `controls` slot; a ref with `leave`, `setMicrophone`, `setCamera`, `phase` and `element`.
- `<TeleInvitePreview>`: the invite card for `GET /v1/invites/{code}`, with host, title, schedule, a message for every `reason.code`, a countdown for `too_early` that refreshes when the call opens, and a Join button or link.
- `<TeleJoinPage>`: preview, then room, for `app/call/[code]/page.tsx`. Every prop can come from a server component.
- Hooks `useTeleJoin` and `useInvitePreview`; helpers `createJoinFetcher`, `createChatHistoryLoader`, `createDiagnosticsReporter`, `createRecordingToggle`, `createEndForAll`, `fetchInvitePreview`, `fillUrl`, `TeleApiError`, `errorFromResponse`, `asTeleError`, `reasonMessage` and `resolveTheme`.
- Theming with the `--tele-*` variables through a `theme` object, `className` or `style`.
- Types for the join response, invite preview, Tele errors and every `<tele-call>` event.
