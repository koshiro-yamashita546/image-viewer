import GalleryGrid from "@/components/GalleryGrid";
import type { GalleryItem } from "@/app/api/gallery/route";
import { listImages } from "@/lib/repositories/images";
import { listAlbumsPaginated } from "@/lib/repositories/albums";
import { getPagesByAlbumId } from "@/lib/repositories/albumPages";
import { getTagsForImage, getTagsForAlbum } from "@/lib/repositories/tags";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const LIMIT = 30;

function mediaUrl(storagePath: string): string {
  const base = process.env.STORAGE_PATH ?? "";
  const rel = storagePath.replace(base, "").replace(/^\//, "");
  return `/api/media/${rel}`;
}

function getInitialGallery(): { items: GalleryItem[]; nextCursor: string | null } {
  const images = listImages(null, LIMIT);
  const albums = listAlbumsPaginated(null, LIMIT);

  const imageItems: GalleryItem[] = images.map((img) => ({
    type: "image",
    id: img.id,
    thumbnail_url: mediaUrl(img.thumbnail_path),
    webp_url: mediaUrl(img.webp_path),
    width: img.width,
    height: img.height,
    created_at: img.created_at,
    tags: getTagsForImage(img.id),
  }));

  const albumItems: GalleryItem[] = albums.map((album) => {
    const pages = getPagesByAlbumId(album.id);
    const cover = album.cover_page
      ? pages.find((p) => p.id === album.cover_page)
      : pages[0];
    return {
      type: "album",
      id: album.id,
      thumbnail_url: cover ? mediaUrl(cover.thumbnail_path) : "",
      webp_url: cover ? mediaUrl(cover.webp_path) : "",
      width: cover?.width ?? 400,
      height: cover?.height ?? 400,
      created_at: album.created_at,
      tags: getTagsForAlbum(album.id),
      title: album.title,
      page_count: pages.length,
    };
  });

  const merged = [...imageItems, ...albumItems]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, LIMIT);

  const nextCursor = merged.length === LIMIT ? merged[merged.length - 1].created_at : null;
  return { items: merged, nextCursor };
}

export default function HomePage() {
  const { items, nextCursor } = getInitialGallery();

  return (
    <main>
      <header className={styles.header}>
        <h1 className={styles.title}>Gallery</h1>
        <a href="/manage" className={styles.manageLink}>Manage</a>
      </header>
      <GalleryGrid initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}
