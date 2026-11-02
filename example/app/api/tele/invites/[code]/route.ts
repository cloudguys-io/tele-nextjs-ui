// EXAMPLE ONLY (see lib/tele-dev.ts): GET /v1/invites/{code} as the signed-in person.
import { badInviteCode, enc, fail, forward, guarded } from "@/lib/tele-dev";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return guarded((ctx) => (badInviteCode(code) ? fail(404, "invite_not_found", "invite not found") : forward(ctx, "GET", `/v1/invites/${enc(code)}`)));
}
