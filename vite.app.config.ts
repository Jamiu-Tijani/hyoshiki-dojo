import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* The React app (docs/redesign.md, Phase 1), built beside the old game until the Phase 5 cut-over.
     dev:   npm run dev  → http://localhost:5173/app/  (the old game stays at /)
     build: dist/app/index.html + dist/app/assets/
   base "./" keeps every URL relative, so the app works under the Pages project path (/hyoshiki-dojo/app/). */
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false, // dist/engine is built first by vite.config.ts
    assetsDir: "app/assets",
    target: "es2020",
    sourcemap: true,
    rollupOptions: { input: "app/index.html" },
  },
});
