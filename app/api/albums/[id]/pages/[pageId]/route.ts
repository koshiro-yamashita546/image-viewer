import { NextRequest, NextResponse } from "next/server";
import {
  getAlbumPageById,
  updatePageOrder,
  deleteAlbumPage,
} from "@/lib/repositories/albumPages";
import { getAlbumById, setCoverPage } from "@/lib/repositories/albums";
import fs from "fs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id: albumId, pageId } = await params;
  const page = getAlbumPageById(pageId);
  if (!page || page.album_id !== albumId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { order } = await request.json();
  if (typeof order === "number") {
    updatePageOrder(pageId, order);
  }

  return NextResponse.json({ page: getAlbumPageById(pageId) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id: albumId, pageId } = await params;
  const page = getAlbumPageById(pageId);
  if (!page || page.album_id !== albumId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If this page is the album cover, clear it
  const album = getAlbumById(albumId);
  if (album?.cover_page === pageId) {
    setCoverPage(albumId, null);
  }

  for (const p of [page.original_path, page.webp_path, page.thumbnail_path]) {
    try { fs.unlinkSync(p); } catch { /* ignore */ }
  }
  deleteAlbumPage(pageId);

  return new NextResponse(null, { status: 204 });
}
