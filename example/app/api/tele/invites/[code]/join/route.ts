// EXAMPLE ONLY (see lib/tele-dev.ts): POST /v1/invites/{code}/join as the signed-in person. Tele records this
// backend's IP for an invite join made this way; rejoins go through /api/tele/calls/{id}/join instead.
import { badInviteCode, enc, fail, forward, guarded } from "@/lib/tele-dev";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return guarded((ctx) => (badInviteCode(code) ? fail(404, "invite_not_found", "invite not found") : forward(ctx, "POST", `/v1/invites/${enc(code)}/join`)));
}
