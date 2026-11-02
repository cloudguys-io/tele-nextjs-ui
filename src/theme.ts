// Theming: the same --tele-* custom properties as <tele-call>, given as an object instead of CSS.
import type { CSSProperties } from "react";
import type { Theme } from "./types.js";

/** Values for the `--tele-*` variables. Any other `--tele-*` key passes through unchanged. */
export type TeleTheme = {
  /** light, dark, or auto (follows the system). Default auto. */
  mode?: Theme;
  accent?: string;
  radius?: string;
  font?: string;
  bg?: string;
  surface?: string;
  text?: string;
  muted?: string;
  line?: string;
  [variable: `--tele-${string}`]: string | undefined;
};

const VARS = ["accent", "radius", "font", "bg", "surface", "text", "muted", "line"] as const;

/** The `theme` prop: a mode (`"light" | "dark" | "auto"`) or a TeleTheme object. */
export type ThemeProp = Theme | TeleTheme;

/** Splits a theme prop into the element's mode and inline CSS variables, merged under `style`. */
export function resolveTheme(theme: ThemeProp | undefined, style?: CSSProperties): { mode: Theme; style: CSSProperties | undefined } {
  if (theme == null || typeof theme === "string") return { mode: theme ?? "auto", style };
  const vars: Record<string, string> = {};
  for (const k of VARS) {
    const v = theme[k];
    if (v) vars[`--tele-${k}`] = v;
  }
  for (const [k, v] of Object.entries(theme)) {
    if (k.startsWith("--tele-") && typeof v === "string") vars[k] = v;
  }
  const hasVars = Object.keys(vars).length > 0;
  return { mode: theme.mode ?? "auto", style: hasVars || style ? ({ ...vars, ...style } as CSSProperties) : undefined };
}
