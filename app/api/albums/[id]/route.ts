import { NextRequest, NextResponse } from "next/server";
import {
  getAlbumById,
  updateAlbumTitle,
  deleteAlbum,
} from "@/lib/repositories/albums";
import { getPagesByAlbumId, deleteAlbumPage } from "@/lib/repositories/albumPages";
import fs from "fs";

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

  return NextResponse.json({ album, pages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = getAlbumById(id);
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title } = await request.json();
  if (title?.trim()) {
    updateAlbumTitle(id, title.trim());
  }

  return NextResponse.json({ album: getAlbumById(id) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = getAlbumById(id);
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pages = getPagesByAlbumId(id);
  for (const page of pages) {
    for (const p of [page.original_path, page.webp_path, page.thumbnail_path]) {
      try { fs.unlinkSync(p); } catch { /* ignore */ }
    }
    deleteAlbumPage(page.id);
  }
  deleteAlbum(id);

  return new NextResponse(null, { status: 204 });
}
