# @tele/nextjs-ui

Next.js App Router components for [Tele](https://tele.cloudguys.io/) video calls: an invite preview card, a
join page, and a call room built on the prebuilt [`@tele/call-ui`](https://github.com/cloudguys-io/tele-ui-pack)
`<tele-call>` element.

It is **UI only**. There is no server code in it and it never sees a Tele API key, secret or service token.
Your backend (for example with [tele-go](https://github.com/cloudguys-io/tele-go) or
[tele-fastapi](https://github.com/cloudguys-io/tele-fastapi)) signs a user token for the signed-in person,
calls Tele, and returns Tele's response body unchanged. These components only call your backend.

```tsx
// app/call/[code]/page.tsx
import { TeleJoinPage } from "@tele/nextjs-ui";

export default async function CallPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TeleJoinPage code={code} leaveHref="/calls" />;
}
```

## Install

Install it together with its peer dependencies, from the release tags:

```bash
npm install github:cloudguys-io/tele-nextjs-ui#v0.1.0 github:cloudguys-io/tele-ui-pack#v0.2.1 livekit-client
```

| Peer | Range |
|---|---|
| `@tele/call-ui` | `^0.2.0`; install `github:cloudguys-io/tele-ui-pack#v0.2.1` |
| `livekit-client` | `^2.15.0` |
| `next` | `>=16 <17` (App Router; tested with 16.4) |
| `react`, `react-dom` | `^19` |

`@tele/call-ui` is not on the npm registry (the `@tele` scope there isn't ours), so install it from git in the
same command, as above. It is declared as an optional peer so npm never tries to fetch it from the registry;
it is still required at runtime. `dist/` is committed, so installing this package from git runs
no build step. `@tele/call-ui` builds itself in a `prepare` script when npm fetches it from git.

## Your backend

The components call these endpoints on your own origin by default. Each one forwards to Tele with the
person's user token and returns Tele's status and JSON body as is, including error bodies
(`{"error": {"code": "...", "message": "..."}}`).

| Default URL | Method | Forwards to | Used by |
|---|---|---|---|
| `/api/tele/invites/{code}` | GET | `GET /v1/invites/{code}` | `TeleInvitePreview`, `TeleJoinPage` |
| `/api/tele/invites/{code}/join` | POST | `POST /v1/invites/{code}/join` | `TeleJoinPage` |
| `chatHistoryUrl`, e.g. `/api/tele/calls/{callId}/messages` | GET | `GET /v1/calls/{id}/messages` | optional |
| `diagnosticsUrl`, e.g. `/api/tele/calls/{callId}/diagnostics` | POST | `POST /v1/calls/{id}/diagnostics` (body unchanged) | optional |
| `recordingUrl`, e.g. `/api/tele/calls/{callId}/recording/{action}` | POST | `POST /v1/calls/{id}/recording/start` or `/stop` | optional, hosts |
| `endForAllUrl`, e.g. `/api/tele/calls/{callId}/end` | POST | `POST /v1/calls/{id}/end` | optional, hosts |

URL templates take `{code}`, `{callId}` (from the join response) and `{action}` (`start` or `stop`). Values are
URL-encoded. Requests are `same-origin` with credentials, so your session cookie goes along; add headers such
as a CSRF token with `fetchInit`.

Recording and "End for all" buttons only appear for hosts (the join response's `role`), and only when you give
the endpoint. Still check on your backend that the person may do it: a visible button is not authorization.

## Components

All components are client components (`"use client"` is kept at the top of each module in `dist/`), so you can
render them from server components. Their props are plain strings and objects, except the optional callbacks.

### `<TeleJoinPage>`

The preview card, then the call room once the person presses **Join**.

```tsx
<TeleJoinPage
  code={code}
  lang="bn"
  layout="speaker"
  features="lobby chat screenshare devices recording-indicator"
  previewUrl="/api/tele/invites/{code}"          // default
  joinUrl="/api/tele/invites/{code}/join"        // default
  chatHistoryUrl="/api/tele/calls/{callId}/messages"
  diagnosticsUrl="/api/tele/calls/{callId}/diagnostics"
  recordingUrl="/api/tele/calls/{callId}/recording/{action}"
  endForAllUrl="/api/tele/calls/{callId}/end"
  leaveHref="/calls"
  theme={{ accent: "#0a7cff", radius: "8px" }}
/>
```

It takes every `TeleCallRoom` prop (except `joinUrl`, `getJoin` and `errorStrings`), plus:

| Prop | |
|---|---|
| `code` | The invite code. Required. |
| `previewUrl`, `joinUrl` | Endpoint templates, defaults above. |
| `preview` | An `InvitePreview` you already loaded, for example in a server component. Skips the first fetch. |
| `inviteStrings` | Overrides for the card and join-error texts (`InviteStrings`). |
| `previewExtra` | Content inside the card, under the title. |
| `previewClassName`, `previewStyle` | For the preview screen. `className` and `style` go to the room. |
| `onJoinClick(preview)` | Called when Join is pressed. |
| `ref` | A `TeleCallRoomHandle`, once the room shows. |

### `<TeleCallRoom>`

`<TeleCall>` from `@tele/call-ui/react`, wired for Next.js.

```tsx
"use client";
import { useRef } from "react";
import { TeleCallRoom, type TeleCallRoomHandle } from "@tele/nextjs-ui";

export function Room({ callId }: { callId: string }) {
  const room = useRef<TeleCallRoomHandle>(null);
  return (
    <TeleCallRoom
      ref={room}
      style={{ height: "100dvh" }}
      joinUrl={`/api/tele/calls/${callId}/join`}
      chatHistoryUrl="/api/tele/calls/{callId}/messages"
      leaveHref={`/calls/${callId}`}
      onChat={(m) => { if (!m.mine) bumpUnread(); }}
      controls={<button onClick={() => room.current?.setCamera(false)}>Hide me</button>}
    />
  );
}
```

| Prop | |
|---|---|
| `joinUrl` | Your join endpoint, POSTed to. Or: |
| `getJoin` | Your own `() => Promise<JoinResponse>`. Reject with a Tele error object to show its message. |
| `fetchInit` | Extra `RequestInit` for `joinUrl` and the endpoint URLs. |
| `features` | Array or space-separated: `lobby`, `chat`, `screenshare`, `devices`, `recording-indicator`. Default all. |
| `lang` | `en` (default) or `bn`; `bn-BD` uses `bn`. |
| `theme` | `light`, `dark`, `auto` (default), or a `TeleTheme` object (see Theming). |
| `layout` | `grid` (default) or `speaker`. |
| `strings` | Label overrides for the call screen (`Strings` of `@tele/call-ui`). |
| `chatHistoryUrl` / `loadChatHistory` | Saved chat for people who join late. |
| `diagnosticsUrl` / `reportDiagnostic` | Connection reports. A `session_pending` answer rejects with that code and the element retries. |
| `recordingUrl` / `setRecording` | Record and Stop recording, hosts only. |
| `endForAllUrl` / `endForAll` | End for all, hosts only. |
| `leaveHref` | Where `router.push` goes after leaving. Default `/`. |
| `onLeave(detail)` | Replaces the navigation. `detail.reason` is `left`, `room_deleted`, `removed`, `duplicate_identity`, `join_failure`, `disconnected` or `error`. |
| `onJoined`, `onError`, `onParticipant`, `onChat` | The element's events (`tele-joined`, `tele-error`, `tele-participant`, `tele-chat`). |
| `friendlyErrors` | Default `true`: join errors with a known code get friendly text in `lang` instead of Tele's message, which the call screen shows. The exception is `too_early`: the call screen always shows its own `tooEarly` label (change it with `strings.tooEarly`), so the "This call opens at ..." text only appears through `renderError`. |
| `errorStrings` | Overrides for those texts. |
| `renderError(error, retry)` | Render your own screen when joining fails. `retry()` mounts a fresh call screen. |
| `controls` | Extra buttons in the control bar (the element's `controls` slot). |
| `className`, `style` | On the `<tele-call>` element. Give it a height, for example `100dvh`. |

The `ref` prop (React 19 style, a `TeleCallRoomHandle`) has `leave()`, `setMicrophone(on)`, `setCamera(on)`, `phase` (`lobby`,
`joining`, `live`, `ended`, `error` or `left`) and `element` (the `<tele-call>` element, which also has `room`,
the LiveKit `Room`).

Changing `joinUrl` mounts a new call screen. Changing `getJoin` does not reconnect a live call; give the room a
different `key` to join another call.

### `<TeleInvitePreview>`

Just the card: host, title, schedule, whether they can join, and a Join button.

Times are shown in the reader's own time zone. The server render leaves each `<time dateTime="...">` empty
(the server doesn't know the reader's zone) and the text fills in right after hydration, so a `preview`
loaded in a server component never hydrates with the server's zone.

```tsx
<TeleInvitePreview code={code} lang="bn" joinHref="/room/{callId}?code={code}" />
```

| Prop | |
|---|---|
| `code` | The invite code. Required. |
| `previewUrl`, `fetchInit`, `preview` | As for `TeleJoinPage`. |
| `onJoin(preview)` | Called when Join is pressed. Or: |
| `joinHref` | Make Join a `next/link`. `{code}` and `{callId}` are filled in. |
| `lang`, `strings`, `theme`, `className`, `style` | |
| `children` | Shown under the title. |

What it says for each `reason.code`:

| `reason.code` | English | Bangla |
|---|---|---|
| `too_early` | This call opens at {time}. (plus a countdown) | এই কলটি {time} এ খুলবে। |
| `too_late`, `call_ended` | This call has ended. | এই কলটি শেষ হয়ে গেছে। |
| `call_cancelled` | This call was cancelled. | এই কলটি বাতিল করা হয়েছে। |
| `not_invited` | You're not on the list for this call. Ask the host to add you. | এই কলের তালিকায় আপনার নাম নেই। আপনাকে যোগ করতে হোস্টকে বলুন। |
| `invite_expired`, `invite_revoked`, `invite_exhausted` | This link is no longer valid. | এই লিংকটি আর বৈধ নয়। |
| `invite_not_found` (404) | This invite link isn't valid. | এই আমন্ত্রণ লিংকটি সঠিক নয়। |

Join errors also cover `call_full`, `rate_limited`, `unauthenticated`, `forbidden`, `not_found` and
`network_error`, `bad_response` and `internal`. Unknown codes show the error's own message (Tele's `message`). For `too_early`, the card reloads the preview when the
call opens, so Join turns on without a refresh. If the reader's clock runs ahead of Tele's and the reload still
says `too_early`, it retries after 1, 2, 4 ... up to 30 seconds until the call is open.

## Hooks

```ts
const { status, preview, error, canJoin, reload } = useInvitePreview(code, { previewUrl, fetchInit, initial, refreshWhenOpen });
const { status, join, error, getJoin, reset } = useTeleJoin({ joinUrl, fetchInit, getJoin, lang, friendlyErrors, strings });
```

- `useInvitePreview`: `status` is `loading`, `ready` or `error`; `error` is a `TeleApiError` for Tele errors.
- `useTeleJoin`: a stable `getJoin` for `<TeleCall>` (or to call yourself), with `status` `idle`, `joining`,
  `joined` or `error`, the last `join` response and the last `error`.

## Helpers (server safe)

These are plain functions, usable in server and client code.

| Helper | |
|---|---|
| `createJoinFetcher(url, init?)` | A `getJoin` that POSTs to `url`. A Tele error body rejects with a `TeleApiError` (`code`, `message`, `status`, `opensAt`), the shape `<tele-call>` understands: `too_early` shows its own label, anything else shows `message`. |
| `createChatHistoryLoader`, `createDiagnosticsReporter`, `createRecordingToggle`, `createEndForAll` | The functions behind the `*Url` props. |
| `fetchInvitePreview(url, init?)` | GET a preview. |
| `TeleApiError`, `errorFromResponse(res)`, `asTeleError(e)` | Tele error handling. Non-JSON failures get `code: "bad_response"`, network failures `network_error`. |
| `reasonMessage(code, { lang, opensAt, strings })`, `inviteStrings`, `INVITE_STRINGS`, `resolveLang`, `formatTime`, `formatCountdown` | The texts. |
| `resolveTheme(theme, style)`, `fillUrl(template, vars)` | |
| `DEFAULT_PREVIEW_URL`, `DEFAULT_JOIN_URL` | |

Types: `JoinResponse`, `JoinCall`, `InvitePreview`, `InviteDenial`, `TeleErrorBody`, `TeleErrorObject`,
`JoinSource`, `HistoryMessage`, `DiagnosticBody`, `DiagnosticKind`, `ReportDiagnostic`, `EndReason`, `Feature`,
`Layout`, `Theme`, `Strings`, `Lang`, `TeleEvents`, `TeleJoinedDetail`, `TeleLeaveDetail`, `TeleErrorDetail`,
`TeleParticipantDetail`, `TeleChatDetail`, `TeleCallElement`, `TeleTheme`, `ThemeProp`, `InviteStrings`, and
every component's props.

## Theming

The card, the join page and the call screen share the `--tele-*` variables of `@tele/call-ui`: `--tele-accent`,
`--tele-radius`, `--tele-font`, `--tele-bg`, `--tele-surface`, `--tele-text`, `--tele-muted`, `--tele-line`,
plus `--tele-on-accent` (text on the Join button). Set them in CSS on any ancestor, or pass a `theme` object:

```tsx
<TeleJoinPage code={code} theme={{ mode: "dark", accent: "#0a7cff", radius: "8px", font: "Inter, sans-serif" }} />
```

`mode` is `light`, `dark` or `auto`. Other `--tele-*` keys pass through. The call screen draws in a Shadow DOM;
style its parts with `tele-call::part(tile)` and friends (see the `@tele/call-ui` theming docs). The card uses
the classes `tele-ui`, `tele-card`, `tele-card__title`, `tele-card__notice`, `tele-btn` and so on, injected once
with React 19's `<style precedence>`.

## Server rendering

Importing the package root on the server never touches `window`: `@tele/call-ui/react` loads the element (Lit
and LiveKit) only in the browser. Server components can render all three components and call the helpers. The
test suite renders every component with `react-dom/server` in a Node environment, from both `src` and `dist`.

## Security

- The Tele API secret and service tokens stay on your backend. Nothing in this package asks for them, and no
  prop takes one.
- Sign user tokens per request with a short TTL (a few minutes) on the server, for the person your own session
  says is signed in. Don't accept a user id from the browser.
- Your join, recording and end endpoints decide who may do what. Tele also checks host rights, but your
  backend should not forward requests for people who are not signed in.
- Invite codes are bearer secrets for `any_client_user` calls. Don't log them.
- The example app's `app/api/` routes and `lib/tele-dev.ts` are a local stand-in for your backend, off unless
  `TELE_EXAMPLE_PROXY=1`, and they refuse any request whose `Host` is not localhost. Don't deploy them.

## Example and tests

`example/` is a minimal Next.js 16 App Router app using the kit, with an example-only proxy and a Playwright
test that opens an invite, joins with fake media, waits for `phase === "live"` and leaves. See
[example/README.md](example/README.md).

```bash
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

`npm test` includes live tests against a Tele API (`test/integration.test.ts`). They run only when
`TELE_API_URL`, `TELE_API_KEY` and `TELE_API_SECRET` are set, and skip otherwise (as in CI).

## License

MIT
