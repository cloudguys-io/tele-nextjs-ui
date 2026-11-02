// EXAMPLE ONLY (see lib/tele-dev.ts): end the call for everyone (host only, enforced by Tele).
import { enc, forward } from "@/lib/tele-dev";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward("POST", `/v1/calls/${enc(id)}/end`);
}
