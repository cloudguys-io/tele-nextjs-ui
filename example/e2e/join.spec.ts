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
  await call.locator('[part~="join"]').click();
  await expect.poll(() => call.evaluate((el) => (el as HTMLElement & { phase: string }).phase), { timeout: 30_000 }).toBe("live");
  await expect(call.locator('[part~="tile"]').first()).toBeVisible();

  // The diagnosticsUrl prop forwards the element's reports through the backend.
  const d = await diagnostics;
  expect([202, 204, 409], `diagnostics answered ${d.status()}`).toContain(d.status());

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
