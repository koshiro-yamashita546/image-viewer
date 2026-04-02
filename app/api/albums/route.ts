import { NextRequest, NextResponse } from "next/server";
import { listAlbums, insertAlbum } from "@/lib/repositories/albums";
import { getPagesByAlbumId } from "@/lib/repositories/albumPages";
import crypto from "crypto";

function mediaUrl(storagePath: string): string {
  const base = process.env.STORAGE_PATH ?? "";
  const rel = storagePath.replace(base, "").replace(/^\//, "");
  return `/api/media/${rel}`;
}

export async function GET() {
  const albums = listAlbums();
  const result = albums.map((album) => {
    const pages = getPagesByAlbumId(album.id);
    const cover = album.cover_page
      ? pages.find((p) => p.id === album.cover_page)
      : pages[0];
    return {
      ...album,
      page_count: pages.length,
      cover_thumbnail_url: cover ? mediaUrl(cover.thumbnail_path) : null,
    };
  });
  return NextResponse.json({ albums: result });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title } = body;
  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const album = insertAlbum({ id: crypto.randomUUID(), title: title.trim() });
  return NextResponse.json({ album }, { status: 201 });
}
