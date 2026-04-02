import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  ensureStorageDirs,
  getOriginalSinglePath,
  getWebpSinglePath,
  getThumbnailSinglePath,
} from "@/lib/storage";
import { processImage } from "@/lib/imageProcessor";
import { insertImage } from "@/lib/repositories/images";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  ensureStorageDirs();

  const formData = await request.formData();
  const files = formData.getAll("images") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const results = [];
  for (const file of files) {
    const id = crypto.randomUUID();
    const ext = path.extname(file.name) || ".jpg";
    const baseName = `${id}${ext}`;
    const webpName = `${id}.webp`;

    const originalPath = getOriginalSinglePath(baseName);
    const webpPath = getWebpSinglePath(webpName);
    const thumbnailPath = getThumbnailSinglePath(webpName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(originalPath, buffer);

    const processed = await processImage(originalPath, webpPath, thumbnailPath);

    const record = insertImage({
      id,
      filename: baseName,
      original_path: originalPath,
      webp_path: webpPath,
      thumbnail_path: thumbnailPath,
      width: processed.width,
      height: processed.height,
    });

    results.push(record);
  }

  return NextResponse.json({ images: results }, { status: 201 });
}
