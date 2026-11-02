// EXAMPLE ONLY (see lib/tele-dev.ts): start or stop recording. Tele itself checks that the user is the host.
import { enc, forward } from "@/lib/tele-dev";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  if (action !== "start" && action !== "stop") return Response.json({ error: { code: "not_found", message: "no such action" } }, { status: 404 });
  return forward("POST", `/v1/calls/${enc(id)}/recording/${action}`);
}
