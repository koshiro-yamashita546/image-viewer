import { NextRequest, NextResponse } from "next/server";
import { getAlbumById } from "@/lib/repositories/albums";
import { setTagsForAlbum, getTagsForAlbum } from "@/lib/repositories/tags";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getAlbumById(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tags } = await request.json() as { tags: string[] };
  setTagsForAlbum(id, tags ?? []);
  return NextResponse.json({ tags: getTagsForAlbum(id) });
}
