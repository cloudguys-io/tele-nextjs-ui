// The server and the reader are in different time zones. The server render must not bake in its own zone, and
// hydrating in the reader's zone must not mismatch: times appear, in the reader's zone, after hydration.
import { afterEach, describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { TeleInvitePreview } from "../src/TeleInvitePreview.js";
import { formatTime } from "../src/messages.js";
import { preview } from "./helpers.js";

const originalTZ = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTZ;
  document.body.innerHTML = "";
});

async function ssrThenHydrate(node: React.ReactElement) {
  process.env.TZ = "Asia/Dhaka";
  const html = renderToString(node);
  const serverStart = formatTime("2026-10-20T04:00:00Z");

  process.env.TZ = "America/New_York";
  const clientStart = formatTime("2026-10-20T04:00:00Z");
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const errors: unknown[] = [];
  await act(async () => {
    hydrateRoot(container, node, { onRecoverableError: (e) => errors.push(e) });
  });
  return { html, container, errors, serverStart, clientStart };
}

describe("hydration across time zones", () => {
  it("renders no time on the server and the reader's local time after hydration", async () => {
    const p = preview();
    const r = await ssrThenHydrate(<TeleInvitePreview code="abc" preview={p} onJoin={() => {}} />);
    expect(r.serverStart).not.toBe(r.clientStart); // the zones really differ
    expect(r.html).not.toContain(r.serverStart);
    expect(r.html).toContain('<time dateTime="2026-10-20T04:00:00Z"></time>');
    expect(r.errors).toEqual([]);
    const time = r.container.querySelector(".tele-card__time")!;
    expect(time.textContent).toBe(`${r.clientStart} to ${formatTime("2026-10-20T04:45:00Z")}`);
  });

  it("does the same for the too_early opening time", async () => {
    const opensAt = "2026-10-20T03:50:00Z";
    const p = preview({ can_join_now: false, reason: { code: "too_early", message: "m", opens_at: opensAt } });
    const r = await ssrThenHydrate(<TeleInvitePreview code="abc" preview={p} />);
    expect(r.errors).toEqual([]);
    expect(r.container.querySelector(".tele-card__notice")!.textContent).toBe(`This call opens at ${formatTime(opensAt)}.`);
  });
});
