// EXAMPLE ONLY (see lib/tele-dev.ts): forwards the call UI's diagnostics body unchanged.
import { badCallId, enc, fail, forward, guarded } from "@/lib/tele-dev";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "invalid_body", "body must be JSON");
  }
  return guarded((ctx) => (badCallId(id) ? fail(404, "not_found", "call not found") : forward(ctx, "POST", `/v1/calls/${enc(id)}/diagnostics`, { body })));
}
