// EXAMPLE ONLY (see lib/tele-dev.ts): creates an instant call hosted by the current example user, and
// returns its invite code, so you can try the join flow without another app.
import { forward } from "@/lib/tele-dev";

export async function POST() {
  const res = await forward("POST", "/v1/calls", {
    title: "Example call",
    access_policy: "any_client_user",
    invite: { label: "tele-nextjs-ui example" },
  });
  if (!res.ok) return res;
  const call = (await res.json()) as { id: string; invite?: { code?: string } };
  return Response.json({ call_id: call.id, code: call.invite?.code ?? null }, { status: 201 });
}
