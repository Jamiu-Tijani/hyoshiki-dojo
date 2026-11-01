import { Texture } from "pixi.js";

/** Rasterises a 100×100 sign drawing (inner SVG markup) into a texture at the given pixel size.
    Going through an <img> keeps text inside signs (止まれ, 徐行) that Pixi's SVG parser would drop. */
export async function svgTexture(markup: string, px: number): Promise<Texture> {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${px}" height="${px}">` +
    markup +
    `</svg>`;
  const img = new Image(px, px);
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  return Texture.from(img);
}
