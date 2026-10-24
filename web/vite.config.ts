import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The FastAPI app (api/) listens on :8000 in development; the browser only ever talks to /api.
const API_ORIGIN = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
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
    setupFiles: ["./src/test/setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
    restoreMocks: true,
  },
});
