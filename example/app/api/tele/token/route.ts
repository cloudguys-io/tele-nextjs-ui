// EXAMPLE ONLY (see lib/tele-dev.ts): a user token for the signed-in person.
import { guarded, tokenResponse } from "@/lib/tele-dev";

export async function POST() {
  return guarded(tokenResponse);
}
