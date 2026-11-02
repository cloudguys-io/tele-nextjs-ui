// EXAMPLE ONLY (see lib/tele-dev.ts): POST /v1/calls/{id}/join with a service token on the person's behalf,
// carrying their IP and user agent, so Tele records the person's IP rather than this backend's.
import { badCallId, enc, fail, forward, guarded, joinUser } from "@/lib/tele-dev";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded((ctx) => {
    if (badCallId(id)) return fail(404, "not_found", "call not found");
    return forward(ctx, "POST", `/v1/calls/${enc(id)}/join`, { service: true, body: { user: joinUser(ctx) } });
  });
}
