// @vitest-environment node
// Against a live Tele API. Skipped unless TELE_API_URL, TELE_API_KEY and TELE_API_SECRET are set (never in CI).
// The helpers are pointed straight at Tele with a user token in fetch init, the way a backend proxy would.
import { createHmac, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createChatHistoryLoader, createJoinFetcher, fetchInvitePreview } from "../src/fetchers.js";
import { TeleApiError } from "../src/errors.js";
import { reasonMessage } from "../src/messages.js";
import type { InvitePreview } from "../src/types.js";

const { TELE_API_URL: url, TELE_API_KEY: key, TELE_API_SECRET: secret } = process.env;
const live = !!(url && key && secret);

function userToken(id: string, name: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ iss: key, iat, nbf: iat, exp: iat + 300, sub: id, name, tele: { scope: "user" } });
  return `${head}.${body}.${createHmac("sha256", secret!).update(`${head}.${body}`).digest("base64url")}`;
}

const user = (tag: string) => `tele-nextjs-ui-${tag}-${randomBytes(4).toString("hex")}`;
const auth = (id: string) => ({ headers: { Authorization: `Bearer ${userToken(id, id.slice(-8))}`, "X-Client-Platform": "web" } });

async function createCall(host: string, policy: "any_client_user" | "listed_only"): Promise<{ id: string; code: string }> {
  const res = await fetch(`${url}/v1/calls`, {
    method: "POST",
    headers: { ...auth(host).headers, "Content-Type": "application/json" },
    body: JSON.stringify({ title: "tele-nextjs-ui integration", access_policy: policy, invite: { label: "it" } }),
  });
  expect(res.status).toBe(201);
  const call = (await res.json()) as { id: string; invite: { code: string } };
  return { id: call.id, code: call.invite.code };
}

describe.skipIf(!live)("live Tele API", () => {
  it("previews and joins an open invite", async () => {
    const host = user("host");
    const guest = user("guest");
    const { id, code } = await createCall(host, "any_client_user");

    const p = await fetchInvitePreview<InvitePreview>(`${url}/v1/invites/${code}`, auth(guest));
    expect(p.call).toMatchObject({ id, title: "tele-nextjs-ui integration", host: { user_id: host } });
    expect(Object.keys(p.call).sort()).toEqual(
      ["host", "id", "join_closes_at", "join_opens_at", "scheduled_end", "scheduled_start", "status", "title"]);
    expect(p.invite).toEqual({ label: "it", expires_at: null });
    expect(p.can_join_now).toBe(true);
    expect(p.reason).toBeUndefined();

    const j = await createJoinFetcher(`${url}/v1/invites/${code}/join`, auth(guest))();
    expect(j.ws_url).toMatch(/^wss?:\/\//);
    expect(j.token).toBeTruthy();
    expect(j.grant_id).toBeTruthy();
    expect(j.role).toBe("participant");
    expect(j.call.id).toBe(id);

    await expect(createChatHistoryLoader(`${url}/v1/calls/{callId}/messages`, auth(guest))(id)).resolves.toEqual([]);
  });

  it("joins an invite with a service token on the person's behalf, as the backend routes do", async () => {
    const { id, code } = await createCall(user("host"), "any_client_user");
    const iat = Math.floor(Date.now() / 1000);
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const head = b64({ alg: "HS256", typ: "JWT" });
    const body = b64({ iss: key, iat, nbf: iat, exp: iat + 120, tele: { scope: "service" } });
    const svc = `${head}.${body}.${createHmac("sha256", secret!).update(`${head}.${body}`).digest("base64url")}`;
    const guest = user("svc-guest");
    const j = await createJoinFetcher(`${url}/v1/invites/${code}/join`, {
      headers: { Authorization: `Bearer ${svc}`, "Content-Type": "application/json", "X-Client-Platform": "web" },
      body: JSON.stringify({ user: { user_id: guest, name: "Guest", ip: "203.0.113.7", user_agent: "tele-nextjs-ui-test" } }),
    })();
    expect(j.call.id).toBe(id);
    expect(j.role).toBe("participant");
    expect(j.token).toBeTruthy();
  });

  it("explains not_invited in the preview and rejects the join with it", async () => {
    const { code } = await createCall(user("host"), "listed_only");
    const stranger = user("stranger");
    const p = await fetchInvitePreview<InvitePreview>(`${url}/v1/invites/${code}`, auth(stranger));
    expect(p.can_join_now).toBe(false);
    expect(p.reason?.code).toBe("not_invited");
    expect(reasonMessage(p.reason?.code)).toMatch(/not on the list/);

    const err = await createJoinFetcher(`${url}/v1/invites/${code}/join`, auth(stranger))().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TeleApiError);
    expect(err).toMatchObject({ code: "not_invited", status: 403 });
  });

  it("rejects an unknown code with invite_not_found", async () => {
    const err = await fetchInvitePreview(`${url}/v1/invites/not-a-real-code`, auth(user("x"))).catch((e: unknown) => e);
    expect(err).toMatchObject({ name: "TeleApiError", code: "invite_not_found", status: 404 });
  });
});
