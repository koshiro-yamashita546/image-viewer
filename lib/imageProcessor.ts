import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface ProcessedImage {
  webpPath: string;
  thumbnailPath: string;
  width: number;
  height: number;
}

const WEBP_QUALITY = 82;
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_QUALITY = 70;

export async function processImage(
  inputPath: string,
  webpOutputPath: string,
  thumbnailOutputPath: string
): Promise<ProcessedImage> {
  fs.mkdirSync(path.dirname(webpOutputPath), { recursive: true });
  fs.mkdirSync(path.dirname(thumbnailOutputPath), { recursive: true });

  // .rotate() with no args auto-applies EXIF orientation
  const pipeline = sharp(inputPath).rotate();

  const { width, height } = await pipeline
    .clone()
    .webp({ quality: WEBP_QUALITY })
    .toFile(webpOutputPath)
    .then((info) => ({ width: info.width, height: info.height }));

  await pipeline
    .clone()
    .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toFile(thumbnailOutputPath);

  return { webpPath: webpOutputPath, thumbnailPath: thumbnailOutputPath, width, height };
}
