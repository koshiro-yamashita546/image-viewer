import { NextRequest, NextResponse } from "next/server";
import { getImageById } from "@/lib/repositories/images";
import { setTagsForImage, getTagsForImage } from "@/lib/repositories/tags";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getImageById(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tags } = await request.json() as { tags: string[] };
  setTagsForImage(id, tags ?? []);
  return NextResponse.json({ tags: getTagsForImage(id) });
}
