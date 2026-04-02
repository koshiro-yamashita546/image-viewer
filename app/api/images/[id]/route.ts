import { NextRequest, NextResponse } from "next/server";
import { getImageById, deleteImage, updateSortOrder } from "@/lib/repositories/images";
import fs from "fs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getImageById(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { sort_order } = await request.json() as { sort_order: number };
  if (typeof sort_order === "number") updateSortOrder(id, sort_order);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = getImageById(id);
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const p of [image.original_path, image.webp_path, image.thumbnail_path]) {
    try { fs.unlinkSync(p); } catch { /* ignore */ }
  }
  deleteImage(id);
  return new NextResponse(null, { status: 204 });
}
