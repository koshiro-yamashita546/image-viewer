import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAlbumById } from "@/lib/repositories/albums";
import {
  insertAlbumPage,
  getMaxPageOrder,
  getPagesByAlbumId,
} from "@/lib/repositories/albumPages";
import {
  ensureAlbumDirs,
  getOriginalAlbumPath,
  getWebpAlbumPath,
  getThumbnailAlbumPath,
} from "@/lib/storage";
import { processImage } from "@/lib/imageProcessor";

export const dynamic = "force-dynamic";

function mediaUrl(storagePath: string): string {
  const base = process.env.STORAGE_PATH ?? "";
  const rel = storagePath.replace(base, "").replace(/^\//, "");
  return `/api/media/${rel}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = getAlbumById(id);
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pages = getPagesByAlbumId(id).map((p) => ({
    ...p,
    webp_url: mediaUrl(p.webp_path),
    thumbnail_url: mediaUrl(p.thumbnail_path),
  }));
  return NextResponse.json({ pages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const album = getAlbumById(albumId);
  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  ensureAlbumDirs(albumId);

  const formData = await request.formData();
  const files = formData.getAll("pages") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  let maxOrder = getMaxPageOrder(albumId);
  const results = [];

  for (const file of files) {
    maxOrder += 1;
    const pageId = crypto.randomUUID();
    const ext = path.extname(file.name) || ".jpg";
    const baseName = `${pageId}${ext}`;
    const webpName = `${pageId}.webp`;

    const originalPath = getOriginalAlbumPath(albumId, baseName);
    const webpPath = getWebpAlbumPath(albumId, webpName);
    const thumbnailPath = getThumbnailAlbumPath(albumId, webpName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(originalPath, buffer);
    const processed = await processImage(originalPath, webpPath, thumbnailPath);

    const page = insertAlbumPage({
      id: pageId,
      album_id: albumId,
      page_order: maxOrder,
      filename: baseName,
      original_path: originalPath,
      webp_path: webpPath,
      thumbnail_path: thumbnailPath,
      width: processed.width,
      height: processed.height,
    });
    results.push({ ...page, webp_url: mediaUrl(page.webp_path), thumbnail_url: mediaUrl(page.thumbnail_path) });
  }

  return NextResponse.json({ pages: results }, { status: 201 });
}
