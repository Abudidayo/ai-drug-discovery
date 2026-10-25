import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The FastAPI app (api/) listens on :8000 in development; the browser only ever talks to /api.
// OXHACK_API_ORIGIN points the dev and preview proxies elsewhere (the end-to-end tests use it).
const API_ORIGIN = process.env.OXHACK_API_ORIGIN ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The API's fixture files, read by the web tests so both sides share one copy of the data.
      "@api-fixtures": fileURLToPath(new URL("../api/oxhack_api/fixtures", import.meta.url)),
    },
  },
  build: {
    // three.js alone is ~530 kB minified; it loads lazily, only when a 3D figure is shown.
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      "/api": { target: API_ORIGIN, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api": { target: API_ORIGIN, changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
    restoreMocks: true,
  },
});
