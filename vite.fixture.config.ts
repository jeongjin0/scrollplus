import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "fixtures",
  build: {
    outDir: "dist-fixture",
    emptyOutDir: true,
    lib: {
      entry: "src/content/fixture-entry.ts",
      formats: ["iife"],
      name: "KeptFixture",
      fileName: () => "fixture.js",
    },
  },
});
