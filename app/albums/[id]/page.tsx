import { notFound } from "next/navigation";
import AlbumViewer from "@/components/AlbumViewer";
import { getAlbumById } from "@/lib/repositories/albums";
import { getPagesByAlbumId } from "@/lib/repositories/albumPages";

export const dynamic = "force-dynamic";

function mediaUrl(storagePath: string): string {
  const base = process.env.STORAGE_PATH ?? "";
  const rel = storagePath.replace(base, "").replace(/^\//, "");
  return `/api/media/${rel}`;
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const album = getAlbumById(id);
  if (!album) notFound();

  const pages = getPagesByAlbumId(id).map((p) => ({
    id: p.id,
    webp_url: mediaUrl(p.webp_path),
    thumbnail_url: mediaUrl(p.thumbnail_path),
    width: p.width,
    height: p.height,
  }));

  if (pages.length === 0) {
    return (
      <main style={{ padding: 40, color: "#ccc", textAlign: "center" }}>
        <h1>{album!.title}</h1>
        <p>This album has no pages.</p>
        <a href="/" style={{ color: "#4a9eff" }}>← Back to gallery</a>
      </main>
    );
  }

  return (
    <main>
      <AlbumViewer pages={pages} title={album!.title} />
    </main>
  );
}
