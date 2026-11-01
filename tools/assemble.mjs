#!/usr/bin/env node
/* Copies the static game files next to the built engine so dist/ is the whole site. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const COPY = ["index.html", ".nojekyll", "css", "js", "levels", "assets"];
for (const p of COPY) {
  const from = path.join(ROOT, p);
  if (!fs.existsSync(from)) continue;
  fs.cpSync(from, path.join(DIST, p), { recursive: true });
}
if (!fs.existsSync(path.join(DIST, "engine", "engine.js"))) { console.error("dist/engine/engine.js missing: run vite build first"); process.exit(1); }
const size = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`dist assembled: ${(size(DIST) / 1024).toFixed(0)} KB total, engine ${(size(path.join(DIST, "engine")) / 1024).toFixed(0)} KB (incl. sourcemaps)`);
