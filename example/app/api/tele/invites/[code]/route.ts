// EXAMPLE ONLY (see lib/tele-dev.ts): GET /v1/invites/{code} as the current user.
import { enc, forward } from "@/lib/tele-dev";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return forward("GET", `/v1/invites/${enc(code)}`);
}
