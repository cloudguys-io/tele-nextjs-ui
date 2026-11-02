// EXAMPLE ONLY (see lib/tele-dev.ts): saved chat for latecomers; `after` and `limit` are passed through.
import { badCallId, enc, fail, forward, guarded } from "@/lib/tele-dev";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = new URLSearchParams();
  const from = new URL(req.url).searchParams;
  for (const k of ["after", "limit"]) {
    const v = from.get(k);
    if (v !== null) q.set(k, v);
  }
  const qs = q.size ? `?${q}` : "";
  return guarded((ctx) => (badCallId(id) ? fail(404, "not_found", "call not found") : forward(ctx, "GET", `/v1/calls/${enc(id)}/messages${qs}`)));
}
