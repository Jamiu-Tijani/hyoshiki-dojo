/* Immersive engine for Hyōshiki Dojo. Loaded on demand by the classic-script game:
     const E = await import(new URL("engine/engine.js", document.baseURI).href)
   Every mechanic that uses it keeps its SVG version as the fallback. */
export { mountApproach } from "./approach";
export type { ApproachOptions, ApproachScene } from "./approach";
export { setMuted } from "./audio";
export const version = "0.1.0";
