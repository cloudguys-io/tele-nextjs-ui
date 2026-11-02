import * as react from 'react';
import { CSSProperties, ReactNode, Ref } from 'react';
import { JoinResponse, TeleEvents, Theme, Feature, Layout, Strings, HistoryMessage, ReportDiagnostic, TeleCallElement, DiagnosticKind, DiagnosticBody } from '@tele/call-ui';
export { DiagnosticBody, DiagnosticKind, EndReason, Feature, HistoryMessage, JoinResponse, Layout, ReportDiagnostic, Strings, TeleCallElement, TeleEvents, Theme } from '@tele/call-ui';

/** A failed request to your backend, carrying Tele's error code when the body had one. */
declare class TeleApiError extends Error {
    readonly name = "TeleApiError";
    /** Tele's error code (`too_early`, `not_invited`, ...), `network_error`, or `bad_response`. */
    readonly code: string;
    /** HTTP status, or 0 when the request never got a response. */
    readonly status: number;
    /** For `too_early`: when the join window opens (RFC 3339). */
    readonly opensAt?: string;
    /** Tele's own message, kept when `message` is replaced by friendlier text. */
    readonly serverMessage: string;
    constructor(init: {
        code: string;
        message: string;
        status: number;
        opensAt?: string;
        serverMessage?: string;
    });
    /** The same error with a different user-facing message. */
    withMessage(message: string): TeleApiError;
}
/** Builds a TeleApiError from a non-2xx response. Never throws. */
declare function errorFromResponse(res: Response): Promise<TeleApiError>;
/**
 * Turns a plain Tele error object (`{ code, message, opens_at? }`, what a hand-written getJoin rejects with)
 * into a TeleApiError. Anything else is returned unchanged.
 */
declare function asTeleError(e: unknown): unknown;

/** Languages with built-in text. A tag like `bn-BD` uses `bn`; anything else falls back to English. */
type Lang = "en" | "bn";
/** The `call` object of a join response. */
type JoinCall = JoinResponse["call"];
/** Event details of `<tele-call>`, one type per event. */
type TeleJoinedDetail = TeleEvents["tele-joined"];
type TeleLeaveDetail = TeleEvents["tele-leave"];
type TeleErrorDetail = TeleEvents["tele-error"];
type TeleParticipantDetail = TeleEvents["tele-participant"];
type TeleChatDetail = TeleEvents["tele-chat"];
/** The inner object of a Tele error body `{"error": {...}}`. */
type TeleErrorObject = {
    code: string;
    message: string;
    /** Only for `too_early`: when the join window opens (RFC 3339). */
    opens_at?: string;
};
/** A Tele error response body, which your backend should pass through unchanged. */
type TeleErrorBody = {
    error: TeleErrorObject;
};
/** Why `can_join_now` is false in an invite preview. */
type InviteDenial = {
    code: "too_early" | "too_late" | "call_ended" | "call_cancelled" | "not_invited" | "invite_expired" | "invite_revoked" | "invite_exhausted" | (string & {});
    message: string;
    opens_at?: string;
};
/** The body of `GET /v1/invites/{code}`, passed through by your backend. */
type InvitePreview = {
    call: {
        id: string;
        title: string;
        status: "scheduled" | "live" | "ended" | "cancelled" | (string & {});
        host: {
            user_id: string;
            name: string;
            team?: string;
        };
        scheduled_start: string | null;
        scheduled_end: string | null;
        join_opens_at: string | null;
        join_closes_at: string | null;
    };
    invite: {
        label: string;
        expires_at: string | null;
    };
    /** Evaluated for the user whose token your backend used. */
    can_join_now: boolean;
    reason?: InviteDenial;
};
/** Either form a component accepts for getting the join response. */
type JoinSource = {
    joinUrl: string;
    fetchInit?: RequestInit;
    getJoin?: never;
} | {
    getJoin: () => Promise<JoinResponse>;
    joinUrl?: never;
    fetchInit?: never;
};

declare const en: {
    loading: string;
    invitedBy: string;
    instantCall: string;
    timeRange: string;
    startsAt: string;
    openNow: string;
    opensIn: string;
    join: string;
    retry: string;
    too_early: string;
    too_early_soon: string;
    too_late: string;
    call_ended: string;
    call_cancelled: string;
    not_invited: string;
    invite_expired: string;
    invite_revoked: string;
    invite_exhausted: string;
    invite_not_found: string;
    not_found: string;
    call_full: string;
    rate_limited: string;
    unauthenticated: string;
    forbidden: string;
    network_error: string;
    bad_response: string;
    internal: string;
    upstream_auth: string;
    upstream_error: string;
    upstream_timeout: string;
    upstream_unreachable: string;
    fallback: string;
};
/** Every label used by the invite preview and join page. Placeholders look like `{name}`. */
type InviteStrings = typeof en;
declare const INVITE_STRINGS: Record<Lang, InviteStrings>;
/** `bn-BD` -> `bn`; anything unknown -> `en`. */
declare function resolveLang(lang: string | null | undefined): Lang;
/** The dictionary for `lang` with per-key overrides applied. */
declare function inviteStrings(lang?: string | null, overrides?: Partial<InviteStrings>): InviteStrings;
/** A date and time in the reader's time zone, in the chosen language. */
declare function formatTime(iso: string, lang?: string | null): string;
/** `01:02:03` style countdown for a number of seconds; hours are dropped below one hour. */
declare function formatCountdown(seconds: number): string;
/**
 * Friendly text for a Tele error or denial code, such as `not_invited` or `too_early`.
 * Returns `undefined` for codes without built-in text, so callers can fall back to the server's message.
 */
declare function reasonMessage(code: string | null | undefined, opts?: {
    lang?: string | null;
    opensAt?: string | null;
    strings?: Partial<InviteStrings>;
}): string | undefined;

/** Values for the `--tele-*` variables. Any other `--tele-*` key passes through unchanged. */
type TeleTheme = {
    /** light, dark, or auto (follows the system). Default auto. */
    mode?: Theme;
    accent?: string;
    radius?: string;
    font?: string;
    bg?: string;
    surface?: string;
    text?: string;
    muted?: string;
    line?: string;
    [variable: `--tele-${string}`]: string | undefined;
};
/** The `theme` prop: a mode (`"light" | "dark" | "auto"`) or a TeleTheme object. */
type ThemeProp = Theme | TeleTheme;
/** Splits a theme prop into the element's mode and inline CSS variables, merged under `style`. */
declare function resolveTheme(theme: ThemeProp | undefined, style?: CSSProperties): {
    mode: Theme;
    style: CSSProperties | undefined;
};

type Phase = "lobby" | "joining" | "live" | "ended" | "error" | "left";
/** What a ref to `<TeleCallRoom>` gives you. */
type TeleCallRoomHandle = {
    /** Disconnect; fires `onLeave` with reason `left`. */
    leave(): Promise<void>;
    setMicrophone(on: boolean): Promise<void>;
    setCamera(on: boolean): Promise<void>;
    /** `lobby`, `joining`, `live`, `ended`, `error` or `left`. */
    readonly phase: Phase;
    /** The `<tele-call>` element, once mounted. */
    readonly element: TeleCallElement | null;
};
type TeleCallRoomProps = {
    /** Your backend's join endpoint (POST). It returns Tele's join response or error body unchanged. */
    joinUrl?: string;
    /** Extra fetch options for joinUrl and the endpoint URLs below, such as headers. */
    fetchInit?: RequestInit;
    /** Later joins (Rejoin, retry) after a successful `joinUrl` join go here, with `{callId}` filled in. */
    rejoinUrl?: string;
    /** Your own join function instead of `joinUrl`. */
    getJoin?: () => Promise<JoinResponse>;
    /** `lobby chat screenshare devices recording-indicator` (array or space-separated). Default: all. */
    features?: Feature[] | string;
    /** `en` or `bn`. Default `en`. */
    lang?: string;
    /** `light`, `dark`, `auto`, or an object of `--tele-*` values plus `mode`. */
    theme?: ThemeProp;
    /** `grid` or `speaker`. Default `grid`. */
    layout?: Layout;
    /** Label overrides for the call screen. */
    strings?: Partial<Strings>;
    /** Overrides for the friendly join-error texts. */
    errorStrings?: Partial<InviteStrings>;
    /** Replace Tele's error messages with friendly text in `lang`. Default true. */
    friendlyErrors?: boolean;
    /** GET endpoint for saved chat (`GET /v1/calls/{id}/messages`). `{callId}` is filled in. */
    chatHistoryUrl?: string;
    loadChatHistory?: (callId: string) => Promise<HistoryMessage[]>;
    /** POST endpoint for diagnostics (`POST /v1/calls/{id}/diagnostics`). `{callId}` is filled in. */
    diagnosticsUrl?: string;
    reportDiagnostic?: ReportDiagnostic;
    /** POST endpoint for recording start/stop. `{callId}` and `{action}` (start | stop) are filled in. Hosts only. */
    recordingUrl?: string;
    setRecording?: (on: boolean) => Promise<unknown>;
    /** POST endpoint for `POST /v1/calls/{id}/end`. `{callId}` is filled in. Hosts only. */
    endForAllUrl?: string;
    endForAll?: () => Promise<unknown>;
    /** Where to go after leaving, with `router.push`. Default `/`. Ignored when `onLeave` is set. */
    leaveHref?: string;
    /** Replaces the default navigation on leave. */
    onLeave?: (detail: TeleLeaveDetail) => void;
    onJoined?: (detail: TeleJoinedDetail) => void;
    onError?: (detail: TeleErrorDetail) => void;
    onParticipant?: (detail: TeleParticipantDetail) => void;
    onChat?: (detail: TeleChatDetail) => void;
    /** Render your own screen when joining fails, instead of the element's. `retry` starts over in the lobby. */
    renderError?: (error: TeleApiError | Error, retry: () => void) => ReactNode;
    /** Extra buttons for the control bar (the element's `controls` slot). */
    controls?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** leave, setMicrophone, setCamera, phase and element. */
    ref?: Ref<TeleCallRoomHandle>;
};
declare function TeleCallRoom({ ref, ...props }: TeleCallRoomProps): react.JSX.Element;

type TeleInvitePreviewProps = {
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
declare function TeleInvitePreview(props: TeleInvitePreviewProps): react.JSX.Element;

type TeleJoinPageProps = Omit<TeleCallRoomProps, "joinUrl" | "getJoin" | "errorStrings" | "rejoinUrl"> & {
    /** The invite code from the route, for example `params.code`. */
    code: string;
    /** Your endpoint for `GET /v1/invites/{code}`. Default `/api/tele/invites/{code}`. */
    previewUrl?: string;
    /** Your endpoint for `POST /v1/invites/{code}/join`. Default `/api/tele/invites/{code}/join`. */
    joinUrl?: string;
    /**
     * Your call-id join endpoint for rejoins after the first invite join. Default `/api/tele/calls/{callId}/join`.
     * Pass `false` to always rejoin through the invite.
     */
    rejoinUrl?: string | false;
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
declare function TeleJoinPage(props: TeleJoinPageProps): react.JSX.Element;

type UseTeleJoinOptions = {
    /** Your backend's join endpoint, POSTed to. It returns Tele's join response or error body unchanged. */
    joinUrl?: string;
    /** Extra fetch options for `joinUrl`, such as headers. */
    fetchInit?: RequestInit;
    /**
     * After a successful join through `joinUrl`, later joins (Rejoin, retry) POST here instead, with `{callId}`
     * filled in from the first join response, for example the call-id route `/api/tele/calls/{callId}/join`.
     */
    rejoinUrl?: string;
    /** Your own join function, instead of `joinUrl`. Reject with a Tele error object to show its message. */
    getJoin?: () => Promise<JoinResponse>;
    /** Language of the friendly error text. Default `en`. */
    lang?: string;
    /** Replace Tele's error messages with friendly text for known codes. Default true. */
    friendlyErrors?: boolean;
    /** Overrides for the friendly texts. */
    strings?: Partial<InviteStrings>;
};
type TeleJoinStatus = "idle" | "joining" | "joined" | "error";
type TeleJoinState = {
    status: TeleJoinStatus;
    /** The last successful join response. */
    join: JoinResponse | null;
    /** The last failure. Tele errors are TeleApiError with `code`. */
    error: TeleApiError | Error | null;
    /** Fetches a join response. Stable across renders; pass it to `<TeleCall getJoin>` or call it yourself. */
    getJoin: () => Promise<JoinResponse>;
    /** Back to `idle`, forgetting the response and error. */
    reset: () => void;
};
declare function useTeleJoin(options: UseTeleJoinOptions): TeleJoinState;

type UseInvitePreviewOptions = {
    /** Your endpoint that forwards `GET /v1/invites/{code}` with the signed-in person's user token. */
    previewUrl?: string;
    /** Extra fetch options, such as headers. */
    fetchInit?: RequestInit;
    /** Use this preview instead of fetching one (for example, loaded by a server component). */
    initial?: InvitePreview;
    /** Reload when a too_early call opens. Default true. */
    refreshWhenOpen?: boolean;
};
type InvitePreviewState = {
    status: "loading" | "ready" | "error";
    preview: InvitePreview | null;
    error: TeleApiError | Error | null;
    /** True when the person can join now. */
    canJoin: boolean;
    /** Fetches the preview again. */
    reload: () => void;
};
declare function useInvitePreview(code: string, options?: UseInvitePreviewOptions): InvitePreviewState;

/** The default preview endpoint on your backend. `{code}` is replaced with the URL-encoded invite code. */
declare const DEFAULT_PREVIEW_URL = "/api/tele/invites/{code}";
/**
 * The default invite join endpoint on your backend (a service-token join that carries the person's IP and user
 * agent). `{code}` is replaced with the URL-encoded invite code.
 */
declare const DEFAULT_JOIN_URL = "/api/tele/invites/{code}/join";
/**
 * The call-id join endpoint of the shared backend convention (a service-token join that carries the person's
 * IP and user agent). Used for rejoins after the first invite join. `{callId}` is replaced.
 */
declare const DEFAULT_CALL_JOIN_URL = "/api/tele/calls/{callId}/join";
/** Saved chat (`GET /v1/calls/{id}/messages`) in the shared backend convention. Opt in with `chatHistoryUrl`. */
declare const DEFAULT_CHAT_HISTORY_URL = "/api/tele/calls/{callId}/messages";
/** Diagnostics (`POST /v1/calls/{id}/diagnostics`) in the shared backend convention. Opt in with `diagnosticsUrl`. */
declare const DEFAULT_DIAGNOSTICS_URL = "/api/tele/calls/{callId}/diagnostics";
/** Replaces `{name}` placeholders with URL-encoded values. Unknown placeholders are left as they are. */
declare function fillUrl(template: string, vars: Record<string, string>): string;
/**
 * A `getJoin` for `<tele-call>`: POSTs to your backend's join endpoint (which calls
 * `POST /v1/invites/{code}/join` or `POST /v1/calls/{id}/join` and returns the body unchanged).
 * A Tele error body becomes a rejected TeleApiError with `code` and `message`, which the element shows.
 */
declare function createJoinFetcher(url: string | URL, init?: RequestInit): () => Promise<JoinResponse>;
/** `loadChatHistory`: GETs `{callId}` from your endpoint, which forwards `GET /v1/calls/{id}/messages`. */
declare function createChatHistoryLoader(template: string, init?: RequestInit): (callId: string) => Promise<HistoryMessage[]>;
/**
 * `reportDiagnostic`: POSTs the body unchanged (your endpoint forwards it to `POST /v1/calls/{id}/diagnostics`).
 * A `session_pending` answer rejects with that code, so the element retries.
 */
declare function createDiagnosticsReporter(template: string, callId: () => string | undefined, init?: RequestInit): (kind: DiagnosticKind, body: DiagnosticBody) => Promise<void>;
/**
 * `setRecording`: POSTs to your endpoint for `POST /v1/calls/{id}/recording/start` or `/stop`.
 * `{action}` in the template becomes `start` or `stop`; without it, `/start` or `/stop` is appended.
 */
declare function createRecordingToggle(template: string, callId: () => string | undefined, init?: RequestInit): (on: boolean) => Promise<unknown>;
/** `endForAll`: POSTs to your endpoint for `POST /v1/calls/{id}/end`. */
declare function createEndForAll(template: string, callId: () => string | undefined, init?: RequestInit): () => Promise<unknown>;
/** GETs an invite preview from your endpoint, which forwards `GET /v1/invites/{code}`. */
declare function fetchInvitePreview<T>(url: string, init?: RequestInit): Promise<T>;

export { DEFAULT_CALL_JOIN_URL, DEFAULT_CHAT_HISTORY_URL, DEFAULT_DIAGNOSTICS_URL, DEFAULT_JOIN_URL, DEFAULT_PREVIEW_URL, INVITE_STRINGS, TeleApiError, TeleCallRoom, TeleInvitePreview, TeleJoinPage, asTeleError, createChatHistoryLoader, createDiagnosticsReporter, createEndForAll, createJoinFetcher, createRecordingToggle, errorFromResponse, fetchInvitePreview, fillUrl, formatCountdown, formatTime, inviteStrings, reasonMessage, resolveLang, resolveTheme, useInvitePreview, useTeleJoin };
export type { InviteDenial, InvitePreview, InvitePreviewState, InviteStrings, JoinCall, JoinSource, Lang, TeleCallRoomHandle, TeleCallRoomProps, TeleChatDetail, TeleErrorBody, TeleErrorDetail, TeleErrorObject, TeleInvitePreviewProps, TeleJoinPageProps, TeleJoinState, TeleJoinStatus, TeleJoinedDetail, TeleLeaveDetail, TeleParticipantDetail, TeleTheme, ThemeProp, UseInvitePreviewOptions, UseTeleJoinOptions };
