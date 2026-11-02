import { vi } from "vitest";
import type { InvitePreview, JoinResponse } from "../src/types.js";

export const JOIN: JoinResponse = {
  ws_url: "wss://lk.example.com",
  token: "lk-token",
  token_expires_at: "2026-11-03T12:00:00Z",
  ice_servers: null,
  identity: "u-1",
  grant_id: "g-1",
  role: "host",
  call: { id: "call-1", title: "Design review" },
};

export function preview(over: Partial<InvitePreview> = {}): InvitePreview {
  return {
    call: {
      id: "call-1", title: "Design review", status: "scheduled",
      host: { user_id: "u-001", name: "Rahim" },
      scheduled_start: "2026-10-20T04:00:00Z", scheduled_end: "2026-10-20T04:45:00Z",
      join_opens_at: "2026-10-20T03:50:00Z", join_closes_at: "2026-10-20T05:15:00Z",
    },
    invite: { label: "calendar link", expires_at: null },
    can_join_now: true,
    ...over,
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" },
  });
}

/** Replaces global fetch with a mock that answers with `respond(url, init)`. */
export function mockFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(respond(String(input), init ?? {})));
  vi.stubGlobal("fetch", fn);
  return fn;
}
