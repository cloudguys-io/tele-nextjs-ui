// Types for what the consumer's backend returns and what the call UI emits. Type-only imports: nothing from
// @tele/call-ui is evaluated here, so this module is safe on the server.
import type {
  DiagnosticBody,
  DiagnosticKind,
  EndReason,
  Feature,
  HistoryMessage,
  JoinResponse,
  Layout,
  ReportDiagnostic,
  Strings,
  TeleCallElement,
  TeleEvents,
  Theme,
} from "@tele/call-ui";

export type {
  DiagnosticBody,
  DiagnosticKind,
  EndReason,
  Feature,
  HistoryMessage,
  JoinResponse,
  Layout,
  ReportDiagnostic,
  Strings,
  TeleCallElement,
  TeleEvents,
  Theme,
};

/** Languages with built-in text. A tag like `bn-BD` uses `bn`; anything else falls back to English. */
export type Lang = "en" | "bn";

/** The `call` object of a join response. */
export type JoinCall = JoinResponse["call"];

/** Event details of `<tele-call>`, one type per event. */
export type TeleJoinedDetail = TeleEvents["tele-joined"];
export type TeleLeaveDetail = TeleEvents["tele-leave"];
export type TeleErrorDetail = TeleEvents["tele-error"];
export type TeleParticipantDetail = TeleEvents["tele-participant"];
export type TeleChatDetail = TeleEvents["tele-chat"];

/** The inner object of a Tele error body `{"error": {...}}`. */
export type TeleErrorObject = {
  code: string;
  message: string;
  /** Only for `too_early`: when the join window opens (RFC 3339). */
  opens_at?: string;
};

/** A Tele error response body, which your backend should pass through unchanged. */
export type TeleErrorBody = { error: TeleErrorObject };

/** Why `can_join_now` is false in an invite preview. */
export type InviteDenial = {
  code:
    | "too_early"
    | "too_late"
    | "call_ended"
    | "call_cancelled"
    | "not_invited"
    | "invite_expired"
    | "invite_revoked"
    | "invite_exhausted"
    | (string & {});
  message: string;
  opens_at?: string;
};

/** The body of `GET /v1/invites/{code}`, passed through by your backend. */
export type InvitePreview = {
  call: {
    id: string;
    title: string;
    status: "scheduled" | "live" | "ended" | "cancelled" | (string & {});
    host: { user_id: string; name: string; team?: string };
    scheduled_start: string | null;
    scheduled_end: string | null;
    join_opens_at: string | null;
    join_closes_at: string | null;
  };
  invite: { label: string; expires_at: string | null };
  /** Evaluated for the user whose token your backend used. */
  can_join_now: boolean;
  reason?: InviteDenial;
};

/** Either form a component accepts for getting the join response. */
export type JoinSource =
  | { joinUrl: string; fetchInit?: RequestInit; getJoin?: never }
  | { getJoin: () => Promise<JoinResponse>; joinUrl?: never; fetchInit?: never };
