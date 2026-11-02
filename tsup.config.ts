import { defineConfig } from "tsup";

// Unbundled ESM: one output file per source file, so each "use client" directive stays at the top of the
// module it belongs to. Next.js then treats the components and hooks as client references, while the
// helpers and types in the package root stay importable from server components.
export default defineConfig({
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  format: ["esm"],
  bundle: false,
  dts: { entry: "src/index.ts" },
  clean: true,
  target: "es2022",
  platform: "neutral",
  sourcemap: false,
  outDir: "dist",
});
