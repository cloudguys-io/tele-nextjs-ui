// EXAMPLE ONLY (see lib/tele-dev.ts): forwards the element's diagnostics body unchanged.
import { enc, forward } from "@/lib/tele-dev";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward("POST", `/v1/calls/${enc(id)}/diagnostics`, await req.json());
}
