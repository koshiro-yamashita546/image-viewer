import { NextRequest, NextResponse } from "next/server";
import { getAlbumById, setCoverPage } from "@/lib/repositories/albums";
import { getAlbumPageById } from "@/lib/repositories/albumPages";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const album = getAlbumById(albumId);
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { page_id } = await request.json();
  if (!page_id) {
    return NextResponse.json({ error: "page_id is required" }, { status: 400 });
  }

  const page = getAlbumPageById(page_id);
  if (!page || page.album_id !== albumId) {
    return NextResponse.json({ error: "Page not found in this album" }, { status: 404 });
  }

  setCoverPage(albumId, page_id);
  return NextResponse.json({ album: getAlbumById(albumId) });
}
