// EXAMPLE ONLY (see lib/tele-dev.ts): POST /v1/invites/{code}/join with a service token on the person's behalf,
// carrying their IP and user agent, so Tele records the person's IP rather than this backend's.
import { badInviteCode, enc, fail, forward, guarded, joinUser } from "@/lib/tele-dev";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return guarded((ctx) => {
    if (badInviteCode(code)) return fail(404, "invite_not_found", "invite not found");
    return forward(ctx, "POST", `/v1/invites/${enc(code)}/join`, { service: true, body: { user: joinUser(ctx) } });
  });
}
