const STYLE_HREF = "tele-nextjs-ui";
const light = `--_bg: var(--tele-bg, #f4f5f6); --_surface: var(--tele-surface, #ffffff); --_text: var(--tele-text, #121316);
  --_muted: var(--tele-muted, #5a5f67); --_line: var(--tele-line, rgb(18 19 22 / 0.12)); --_accent: var(--tele-accent, oklch(0.54 0.19 33));
  --_on-accent: var(--tele-on-accent, #ffffff); color-scheme: light;`;
const dark = `--_bg: var(--tele-bg, #0e0f11); --_surface: var(--tele-surface, #16181b); --_text: var(--tele-text, #eceef0);
  --_muted: var(--tele-muted, #9ba1aa); --_line: var(--tele-line, rgb(236 238 240 / 0.12)); --_accent: var(--tele-accent, oklch(0.7 0.17 35));
  --_on-accent: var(--tele-on-accent, #0e0f11); color-scheme: dark;`;
const CSS = `
.tele-ui { ${light} --_radius: var(--tele-radius, 16px); font-family: var(--tele-font, ui-sans-serif, system-ui, sans-serif);
  color: var(--_text); -webkit-font-smoothing: antialiased; }
.tele-ui[data-theme="dark"] { ${dark} }
@media (prefers-color-scheme: dark) { .tele-ui:not([data-theme="light"]) { ${dark} } }
.tele-ui *, .tele-ui *::before, .tele-ui *::after { box-sizing: border-box; }
.tele-page { min-height: 100%; display: grid; place-items: center; padding: 1.5rem 1rem; background: var(--_bg); }
.tele-card { width: 100%; max-width: 32rem; background: var(--_surface); border: 1px solid var(--_line);
  border-radius: var(--_radius); padding: 2rem 1.75rem; }
.tele-card__eyebrow, .tele-card__time, .tele-card__status { margin: 0; color: var(--_muted); font-size: .875rem; line-height: 1.5; }
.tele-card__title { margin: .5rem 0 .25rem; font-size: 1.75rem; line-height: 1.2; font-weight: 600; letter-spacing: -.01em; overflow-wrap: anywhere; }
.tele-card__notice { margin: 1.5rem 0 0; padding: .75rem 1rem; border-radius: calc(var(--_radius) * .6);
  background: color-mix(in oklch, var(--_accent) 9%, transparent); color: var(--_text); font-size: .9375rem; line-height: 1.5; }
.tele-card__countdown { margin: 1.5rem 0 0; font-variant-numeric: tabular-nums; font-size: 1.5rem; font-weight: 500; }
.tele-card__actions { margin-top: 1.75rem; display: flex; gap: .75rem; flex-wrap: wrap; }
.tele-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 2.75rem; padding: .6rem 1.25rem;
  border-radius: 9999px; border: 0; font: inherit; font-size: .9375rem; font-weight: 500; text-decoration: none; cursor: pointer;
  background: var(--_accent); color: var(--_on-accent); transition: opacity .15s, transform .1s; }
.tele-btn:active { transform: scale(.98); }
.tele-btn:focus-visible { outline: 2px solid var(--_accent); outline-offset: 2px; }
.tele-btn[aria-disabled="true"], .tele-btn:disabled { opacity: .45; pointer-events: none; }
.tele-btn--quiet { background: transparent; color: var(--_text); border: 1px solid var(--_line); }
.tele-room { height: 100dvh; }
`;
export {
  CSS,
  STYLE_HREF
};
