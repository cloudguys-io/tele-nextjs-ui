// EXAMPLE ONLY. A stand-in for your real backend, so the example can talk to a Tele API for local testing.
// It serves the shared Tele backend routes (the same ones tele-fastapi's routers and tele-go's example serve):
//
//   POST /api/tele/token                    user token for the signed-in person
//   GET  /api/tele/invites/{code}           invite preview, as the person (user token)
//   POST /api/tele/invites/{code}/join      invite join, as the person (user token)
//   POST /api/tele/calls/{id}/join          call join, service token carrying the person's IP and user agent
//   GET  /api/tele/calls/{id}/messages      saved chat (after, limit passed through)
//   POST /api/tele/calls/{id}/diagnostics   the call UI's diagnostics body, forwarded unchanged
//
// It signs tokens with TELE_API_KEY / TELE_API_SECRET from the environment. "Who is signed in" is a random id
// kept in a cookie: there is no login. In your app, identify the person with your own session, and use a Tele
// server SDK (tele-go, tele-fastapi, @tele/node). The API secret must never reach the browser.
//
// Everything here answers 404 unless TELE_EXAMPLE_PROXY=1 and the key and secret are set, and 403 unless the
// request's Host is local (localhost, 127.0.0.1, [::1] or *.localhost), so it can't serve a deployed site.
import { createHmac, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";

const COOKIE = "tele_example_user";
const TIMEOUT_MS = 10_000;
const USER_TTL = 300;

type DevConfig = { url: string; key: string; secret: string };
type User = { id: string; name: string };

function config(): DevConfig | null {
  const { TELE_EXAMPLE_PROXY, TELE_API_URL, TELE_API_KEY, TELE_API_SECRET } = process.env;
  if (TELE_EXAMPLE_PROXY !== "1" || !TELE_API_KEY || !TELE_API_SECRET) return null;
  return { url: (TELE_API_URL || "https://tele-api.cloudguys.io").replace(/\/+$/, ""), key: TELE_API_KEY, secret: TELE_API_SECRET };
}

const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");

// HS256, the same claims as @tele/node's TeleSigner: user tokens carry sub/name, service tokens neither.
function sign(c: DevConfig, ttl: number, extra: Record<string, unknown>): { token: string; exp: number } {
  const iat = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: c.key, iat, nbf: iat, exp: iat + ttl, ...extra }));
  const sig = createHmac("sha256", c.secret).update(`${head}.${body}`).digest("base64url");
  return { token: `${head}.${body}.${sig}`, exp: iat + ttl };
}
const userToken = (c: DevConfig, u: User) => sign(c, USER_TTL, { sub: u.id, name: u.name, tele: { scope: "user" } });
const serviceToken = (c: DevConfig) => sign(c, 120, { tele: { scope: "service" } });

/** True for localhost, 127.0.0.1, [::1] and *.localhost, with or without a port. */
export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const name = host.trim().toLowerCase().replace(/:\d+$/, "").replace(/^\[(.*)\]$/, "$1");
  return name === "localhost" || name === "127.0.0.1" || name === "::1" || name.endsWith(".localhost");
}

/** A Tele-shaped error body. */
export const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status });

// The example's "signed-in" person: a random id in a cookie, prefixed so test data is easy to spot.
async function currentUser(): Promise<User> {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id || !/^tele-nextjs-ui-[a-f0-9]{12}$/.test(id)) {
    id = `tele-nextjs-ui-${randomBytes(6).toString("hex")}`;
    jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return { id, name: `Guest ${id.slice(-4)}` };
}

export type Ctx = { c: DevConfig; user: User; req: Headers };

/** Runs `fn` only when the example proxy is enabled and the request is local. */
export async function guarded(fn: (ctx: Ctx) => Promise<Response> | Response): Promise<Response> {
  const c = config();
  if (!c) return fail(404, "not_found", "example proxy disabled");
  const req = await headers();
  if (!isLocalHost(req.get("host"))) return fail(403, "forbidden", "the example proxy only answers on localhost");
  return fn({ c, user: await currentUser(), req });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-Za-z0-9_-]{1,128}$/;
export const badCallId = (id: string) => !UUID.test(id);
export const badInviteCode = (code: string) => !CODE.test(code);

/** The person's own IP, for service-token joins. Locally this is the loopback address. */
export function clientIp(req: Headers): string {
  return req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.get("x-real-ip") || "127.0.0.1";
}

/**
 * Calls Tele and relays its answer. Tele 4xx other than 401 pass through unchanged; Tele 401 becomes 502
 * upstream_auth, Tele 5xx 502 upstream_error, a timeout 503 upstream_timeout, no connection 502
 * upstream_unreachable.
 */
export async function forward(ctx: Ctx, method: string, path: string, opts: { body?: unknown; service?: boolean } = {}): Promise<Response> {
  const token = opts.service ? serviceToken(ctx.c).token : userToken(ctx.c, ctx.user).token;
  let res: Response;
  try {
    res = await fetch(`${ctx.c.url}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client-Platform": ctx.req.get("x-client-platform") || "web",
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") return fail(503, "upstream_timeout", "Tele did not answer in time");
    return fail(502, "upstream_unreachable", "Tele is unreachable");
  }
  if (res.status === 401) return fail(502, "upstream_auth", "Tele rejected the backend's credentials");
  if (res.status >= 500) return fail(502, "upstream_error", `Tele answered ${res.status}`);
  if (res.status === 204) return new Response(null, { status: 204 });
  return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}

/** `{"token", "expires_at"}` for the current person. */
export function tokenResponse(ctx: Ctx): Response {
  const { token, exp } = userToken(ctx.c, ctx.user);
  return Response.json({ token, expires_at: new Date(exp * 1000).toISOString() });
}

export const enc = encodeURIComponent;
