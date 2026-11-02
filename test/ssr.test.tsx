// @vitest-environment node
// Server rendering: importing the package (source and the built dist) and rendering every component must not
// touch window, document or navigator. The real @tele/call-ui/react is used here, not the fake.
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { preview } from "./helpers.js";
import type * as KitModule from "../src/index.js";

type Kit = typeof KitModule;

vi.mock("next/navigation.js", () => ({ useRouter: () => ({ push: () => {} }) }));

const dist = fileURLToPath(new URL("../dist/index.js", import.meta.url));

describe("server rendering", () => {
  it("runs without browser globals", () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  for (const [name, load] of [
    ["src", () => import("../src/index.js")],
    ["dist", () => import(/* @vite-ignore */ dist)],
  ] as const) {
    it.skipIf(name === "dist" && !existsSync(dist))(`imports and renders from ${name}`, async () => {
      const kit = (await load()) as Kit;
      expect(kit.createJoinFetcher("/x")).toBeTypeOf("function");

      const room = renderToString(createElement(kit.TeleCallRoom, { joinUrl: "/api/join", lang: "bn", theme: { accent: "red" } }));
      expect(room).toContain("<tele-call");
      expect(room).toContain('lang="bn"');
      expect(room).toContain("--tele-accent:red");

      const card = renderToString(createElement(kit.TeleInvitePreview, { code: "abc" }));
      expect(card).toContain("Checking the invite...");

      const page = renderToString(createElement(kit.TeleJoinPage, { code: "abc", preview: preview() }));
      expect(page).toContain("Design review");
      expect(page).toContain("Join the call");
    });
  }

  it.skipIf(!existsSync(dist))("dist loads under plain Node ESM, without a bundler", async () => {
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync(process.execPath, ["--input-type=module", "-e",
      `const m = await import(${JSON.stringify(new URL("../dist/index.js", import.meta.url).href)});
       console.log(typeof m.TeleJoinPage, typeof m.createJoinFetcher, m.DEFAULT_JOIN_URL);`], { encoding: "utf8" });
    expect(out.trim()).toBe("function function /api/tele/invites/{code}/join");
  });

  it("keeps \"use client\" at the top of every client module in dist", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const dir = fileURLToPath(new URL("../dist/", import.meta.url));
    if (!existsSync(dir)) return;
    const client = ["TeleCallRoom.js", "TeleInvitePreview.js", "TeleJoinPage.js", "useTeleJoin.js", "useInvitePreview.js", "LocalTime.js"];
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".js"))) {
      const first = readFileSync(dir + f, "utf8").split("\n", 1)[0];
      if (client.includes(f)) expect(first, f).toBe('"use client";');
      else expect(first, f).not.toBe('"use client";');
    }
  });
});
