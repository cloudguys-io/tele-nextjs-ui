import { defineConfig, devices } from "@playwright/test";

// Runs against an example app already listening on :3210 (npm run build && npm start, or npm run dev),
// with TELE_EXAMPLE_PROXY=1 and a Tele API key and secret in its environment.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3210",
    ...devices["Desktop Chrome"],
    permissions: ["camera", "microphone"],
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
    trace: "retain-on-failure",
  },
});
