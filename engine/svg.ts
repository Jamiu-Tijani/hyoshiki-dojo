import { Texture } from "pixi.js";

/** Loads an image file (the official sign SVGs) into a texture. */
export async function urlTexture(url: string, px: number): Promise<Texture> {
  const img = new Image(px, px);
  img.src = url;
  await img.decode();
  return Texture.from(img);
}
