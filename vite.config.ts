import { defineConfig } from "vite";

/* Builds the immersive engine as an ES module the classic-script game loads on demand:
     import("./engine/engine.js")
   Pixi's renderer back-ends stay as separate chunks, so only what the device needs is fetched. */
export default defineConfig({
  build: {
    outDir: "dist/engine",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: true,
    lib: {
      entry: "engine/index.ts",
      formats: ["es"],
      fileName: () => "engine.js",
    },
  },
});
