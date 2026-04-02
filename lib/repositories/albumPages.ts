import { db } from "../db";

export interface AlbumPageRecord {
  id: string;
  album_id: string;
  page_order: number;
  filename: string;
  original_path: string;
  webp_path: string;
  thumbnail_path: string;
  width: number;
  height: number;
}

export function insertAlbumPage(page: AlbumPageRecord): AlbumPageRecord {
  const stmt = db.prepare(`
    INSERT INTO album_pages
      (id, album_id, page_order, filename, original_path, webp_path, thumbnail_path, width, height)
    VALUES
      (@id, @album_id, @page_order, @filename, @original_path, @webp_path, @thumbnail_path, @width, @height)
    RETURNING *
  `);
  return stmt.get(page) as AlbumPageRecord;
}

export function getAlbumPageById(id: string): AlbumPageRecord | undefined {
  return db.prepare("SELECT * FROM album_pages WHERE id = ?").get(id) as AlbumPageRecord | undefined;
}

export function getPagesByAlbumId(albumId: string): AlbumPageRecord[] {
  return db
    .prepare("SELECT * FROM album_pages WHERE album_id = ? ORDER BY page_order ASC")
    .all(albumId) as AlbumPageRecord[];
}

export function updatePageOrder(id: string, order: number): void {
  db.prepare("UPDATE album_pages SET page_order = ? WHERE id = ?").run(order, id);
}

export function deleteAlbumPage(id: string): void {
  db.prepare("DELETE FROM album_pages WHERE id = ?").run(id);
}

export function getMaxPageOrder(albumId: string): number {
  const row = db
    .prepare("SELECT MAX(page_order) as max_order FROM album_pages WHERE album_id = ?")
    .get(albumId) as { max_order: number | null };
  return row.max_order ?? 0;
}
