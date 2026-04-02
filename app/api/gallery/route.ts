import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listImages } from "@/lib/repositories/images";
import { listAlbumsPaginated } from "@/lib/repositories/albums";
import { getPagesByAlbumId } from "@/lib/repositories/albumPages";
import { getTagsForImage, getTagsForAlbum } from "@/lib/repositories/tags";

export interface GalleryItem {
  type: "image" | "album";
  id: string;
  thumbnail_url: string;
  webp_url: string;
  width: number;
  height: number;
  created_at: string;
  tags: string[];
  sort_order?: number;
  // album only
  title?: string;
  page_count?: number;
}

function mediaUrl(storagePath: string): string {
  const base = process.env.STORAGE_PATH ?? "";
  const rel = storagePath.replace(base, "").replace(/^\//, "");
  return `/api/media/${rel}`;
}

function getImageIdsByTags(tagNames: string[]): Set<string> {
  const placeholders = tagNames.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT DISTINCT it.image_id FROM image_tags it
       JOIN tags t ON t.id = it.tag_id
       WHERE t.name IN (${placeholders})`
    )
    .all(...tagNames) as { image_id: string }[];
  return new Set(rows.map((r) => r.image_id));
}

function getAlbumIdsByTags(tagNames: string[]): Set<string> {
  const placeholders = tagNames.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT DISTINCT at.album_id FROM album_tags at
       JOIN tags t ON t.id = at.tag_id
       WHERE t.name IN (${placeholders})`
    )
    .all(...tagNames) as { album_id: string }[];
  return new Set(rows.map((r) => r.album_id));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const tagsParam = searchParams.get("tags");
  const filterTags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const images = listImages(cursor, limit * 2);
  const albums = listAlbumsPaginated(cursor, limit * 2);

  let imageItems: GalleryItem[] = images.map((img) => ({
    type: "image",
    id: img.id,
    thumbnail_url: mediaUrl(img.thumbnail_path),
    webp_url: mediaUrl(img.webp_path),
    width: img.width,
    height: img.height,
    created_at: img.created_at,
    tags: getTagsForImage(img.id),
    sort_order: img.sort_order,
  }));

  let albumItems: GalleryItem[] = albums.map((album) => {
    const pages = getPagesByAlbumId(album.id);
    const coverPage = album.cover_page
      ? pages.find((p) => p.id === album.cover_page)
      : pages[0];
    return {
      type: "album",
      id: album.id,
      thumbnail_url: coverPage ? mediaUrl(coverPage.thumbnail_path) : "",
      webp_url: coverPage ? mediaUrl(coverPage.webp_path) : "",
      width: coverPage?.width ?? 400,
      height: coverPage?.height ?? 400,
      created_at: album.created_at,
      tags: getTagsForAlbum(album.id),
      title: album.title,
      page_count: pages.length,
    };
  });

  if (filterTags.length > 0) {
    const matchedImageIds = getImageIdsByTags(filterTags);
    const matchedAlbumIds = getAlbumIdsByTags(filterTags);
    imageItems = imageItems.filter((i) => matchedImageIds.has(i.id));
    albumItems = albumItems.filter((a) => matchedAlbumIds.has(a.id));
  }

  const merged = [...imageItems, ...albumItems]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);

  const nextCursor =
    merged.length === limit ? merged[merged.length - 1].created_at : null;

  return NextResponse.json({ items: merged, nextCursor });
}
