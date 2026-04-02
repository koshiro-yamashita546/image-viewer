import { db } from "../db";

export interface ImageRecord {
  id: string;
  filename: string;
  original_path: string;
  webp_path: string;
  thumbnail_path: string;
  width: number;
  height: number;
  sort_order: number;
  created_at: string;
}

export function getMaxSortOrder(): number {
  const row = db.prepare("SELECT MAX(sort_order) as m FROM images").get() as { m: number | null };
  return row.m ?? 0;
}

export function insertImage(image: Omit<ImageRecord, "created_at" | "sort_order">): ImageRecord {
  const sort_order = getMaxSortOrder() + 1;
  const stmt = db.prepare(`
    INSERT INTO images (id, filename, original_path, webp_path, thumbnail_path, width, height, sort_order)
    VALUES (@id, @filename, @original_path, @webp_path, @thumbnail_path, @width, @height, @sort_order)
    RETURNING *
  `);
  return stmt.get({ ...image, sort_order }) as ImageRecord;
}

export function getImageById(id: string): ImageRecord | undefined {
  return db.prepare("SELECT * FROM images WHERE id = ?").get(id) as ImageRecord | undefined;
}

export function deleteImage(id: string): void {
  db.prepare("DELETE FROM images WHERE id = ?").run(id);
}

export function updateSortOrder(id: string, sort_order: number): void {
  db.prepare("UPDATE images SET sort_order = ? WHERE id = ?").run(sort_order, id);
}

export function listImages(cursor: string | null, limit: number): ImageRecord[] {
  if (cursor) {
    return db
      .prepare("SELECT * FROM images WHERE created_at < ? ORDER BY sort_order ASC, created_at DESC LIMIT ?")
      .all(cursor, limit) as ImageRecord[];
  }
  return db
    .prepare("SELECT * FROM images ORDER BY sort_order ASC, created_at DESC LIMIT ?")
    .all(limit) as ImageRecord[];
}
