// EXAMPLE ONLY (see lib/tele-dev.ts): saved chat for latecomers.
import { enc, forward } from "@/lib/tele-dev";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward("GET", `/v1/calls/${enc(id)}/messages`);
}
