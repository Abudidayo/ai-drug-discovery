import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("..", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../../.context/prototype-dist", import.meta.url)),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        designs: fileURLToPath(new URL("index.html", import.meta.url)),
        workflowReview: fileURLToPath(new URL("workflow-review/index.html", import.meta.url)),
      },
    },
  },
});
