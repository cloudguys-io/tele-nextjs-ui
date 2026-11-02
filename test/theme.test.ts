import { describe, expect, it } from "vitest";
import { resolveTheme } from "../src/theme.js";

describe("resolveTheme", () => {
  it("passes a mode through", () => {
    expect(resolveTheme("dark")).toEqual({ mode: "dark", style: undefined });
    expect(resolveTheme(undefined, { height: 10 })).toEqual({ mode: "auto", style: { height: 10 } });
  });

  it("turns an object into --tele-* variables under the given style", () => {
    const r = resolveTheme({ mode: "light", accent: "#0a7cff", radius: "8px", "--tele-on-accent": "#000" }, { height: "100dvh" });
    expect(r.mode).toBe("light");
    expect(r.style).toEqual({ "--tele-accent": "#0a7cff", "--tele-radius": "8px", "--tele-on-accent": "#000", height: "100dvh" });
  });

  it("returns no style for an empty object", () => {
    expect(resolveTheme({})).toEqual({ mode: "auto", style: undefined });
  });
});
