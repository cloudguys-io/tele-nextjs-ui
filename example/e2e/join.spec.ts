import { expect, test } from "@playwright/test";

test("open an invite link, see the preview, join, go live, leave", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start a test call" }).click();
  await page.waitForURL(/\/call\/[^/]+$/);

  // The preview card.
  await expect(page.getByRole("heading", { name: "Example call" })).toBeVisible();
  await expect(page.getByText(/invited you to$/)).toBeVisible();
  await expect(page.getByText("Instant call")).toBeVisible();
  await expect(page.locator(".tele-card [role=status]")).toHaveText("The call is open.");
  await page.getByRole("button", { name: "Join the call" }).click();

  // The element's own lobby, then the call.
  const call = page.locator("tele-call");
  await expect(call).toBeVisible();
  const diagnostics = page.waitForResponse((r) => r.url().includes("/diagnostics") && r.request().method() === "POST");
  const inviteJoin = page.waitForResponse((r) => /\/api\/tele\/invites\/[^/]+\/join$/.test(r.url()));
  await call.locator('[part~="join"]').click();
  const joined = await inviteJoin;
  expect(joined.status()).toBe(200);
  const callId = ((await joined.json()) as { call: { id: string } }).call.id;
  await expect.poll(() => call.evaluate((el) => (el as HTMLElement & { phase: string }).phase), { timeout: 30_000 }).toBe("live");
  await expect(call.locator('[part~="tile"]').first()).toBeVisible();

  // The diagnosticsUrl prop forwards the element's reports through the backend.
  const d = await diagnostics;
  expect([202, 204, 409], `diagnostics answered ${d.status()}`).toContain(d.status());

  // The rest of the shared backend routes, as the same signed-in person.
  const routes = await page.evaluate(async (id) => {
    const post = (u: string) => fetch(u, { method: "POST" });
    const rejoin = await post(`/api/tele/calls/${id}/join`);
    const token = await post("/api/tele/token");
    const messages = await fetch(`/api/tele/calls/${id}/messages?limit=5`);
    const badId = await post("/api/tele/calls/not-a-uuid/join");
    return {
      rejoin: rejoin.status, rejoinCall: ((await rejoin.json()) as { call?: { id: string } }).call?.id,
      token: token.status, tokenBody: Object.keys(await token.json()).sort(),
      messages: messages.status, hasMessages: Array.isArray(((await messages.json()) as { messages?: unknown }).messages),
      badId: badId.status, badIdCode: ((await badId.json()) as { error: { code: string } }).error.code,
    };
  }, callId);
  expect(routes).toEqual({
    rejoin: 200, rejoinCall: callId, token: 200, tokenBody: ["expires_at", "token"],
    messages: 200, hasMessages: true, badId: 404, badIdCode: "not_found",
  });

  // Leaving navigates to leaveHref with the router.
  await call.locator('[part~="leave"]').click();
  await page.waitForURL(/\/\?left=1$/);
  await expect(page.getByRole("status")).toHaveText("You left the call.");
});

test("a bad invite code gets a friendly message in Bangla", async ({ page }) => {
  await page.goto("/call/not-a-real-code?lang=bn");
  await expect(page.locator(".tele-card [role=alert]")).toHaveText("এই আমন্ত্রণ লিংকটি সঠিক নয়।");
  await expect(page.getByRole("button", { name: "আবার চেষ্টা করুন" })).toBeVisible();
});
