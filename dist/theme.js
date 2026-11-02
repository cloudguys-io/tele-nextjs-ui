const VARS = ["accent", "radius", "font", "bg", "surface", "text", "muted", "line"];
function resolveTheme(theme, style) {
  if (theme == null || typeof theme === "string") return { mode: theme ?? "auto", style };
  const vars = {};
  for (const k of VARS) {
    const v = theme[k];
    if (v) vars[`--tele-${k}`] = v;
  }
  for (const [k, v] of Object.entries(theme)) {
    if (k.startsWith("--tele-") && typeof v === "string") vars[k] = v;
  }
  const hasVars = Object.keys(vars).length > 0;
  return { mode: theme.mode ?? "auto", style: hasVars || style ? { ...vars, ...style } : void 0 };
}
export {
  resolveTheme
};
