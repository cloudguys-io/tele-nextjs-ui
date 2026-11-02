// EXAMPLE ONLY. A stand-in for your real backend, so the example can talk to a Tele API for local testing.
//
// It signs Tele user tokens with TELE_API_KEY / TELE_API_SECRET from the environment and forwards requests,
// returning Tele's bodies unchanged. "Who is signed in" is a random id kept in a cookie: there is no login.
// In your app, identify the person with your own session, and sign tokens with your server SDK
// (tele-go, tele-fastapi, @tele/node). The API secret must never reach the browser.
//
// Everything here answers 404 unless TELE_EXAMPLE_PROXY=1 and the key and secret are set.
import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "tele_example_user";

type DevConfig = { url: string; key: string; secret: string };

function config(): DevConfig | null {
  const { TELE_EXAMPLE_PROXY, TELE_API_URL, TELE_API_KEY, TELE_API_SECRET } = process.env;
  if (TELE_EXAMPLE_PROXY !== "1" || !TELE_API_KEY || !TELE_API_SECRET) return null;
  return { url: (TELE_API_URL || "https://tele-api.cloudguys.io").replace(/\/+$/, ""), key: TELE_API_KEY, secret: TELE_API_SECRET };
}

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");

// HS256 user token, the same claims as @tele/node's TeleSigner.userToken.
function userToken(c: DevConfig, user: { id: string; name: string }, ttl = 300): string {
  const iat = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: c.key, iat, nbf: iat, exp: iat + ttl, sub: user.id, name: user.name, tele: { scope: "user" } }));
  const sig = createHmac("sha256", c.secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

// The example's "signed-in" person: a random id in a cookie, prefixed so test data is easy to spot.
async function currentUser(): Promise<{ id: string; name: string }> {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id || !/^tele-nextjs-ui-[a-f0-9]{12}$/.test(id)) {
    id = `tele-nextjs-ui-${randomBytes(6).toString("hex")}`;
    jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return { id, name: `Guest ${id.slice(-4)}` };
}

const notFound = () => Response.json({ error: { code: "not_found", message: "example proxy disabled" } }, { status: 404 });

/** Calls Tele as the current example user and returns Tele's response as is. */
export async function forward(method: string, path: string, body?: unknown): Promise<Response> {
  const c = config();
  if (!c) return notFound();
  const token = userToken(c, await currentUser());
  let res: Response;
  try {
    res = await fetch(`${c.url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Platform": "web",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: { code: "internal", message: "Tele is unreachable" } }, { status: 502 });
  }
  if (res.status === 204) return new Response(null, { status: 204 });
  return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}

export const enc = encodeURIComponent;
