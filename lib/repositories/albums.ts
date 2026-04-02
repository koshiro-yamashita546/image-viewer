import { db } from "../db";

export interface AlbumRecord {
  id: string;
  title: string;
  cover_page: string | null;
  created_at: string;
}

export function insertAlbum(album: Omit<AlbumRecord, "created_at" | "cover_page">): AlbumRecord {
  const stmt = db.prepare(`
    INSERT INTO albums (id, title) VALUES (@id, @title) RETURNING *
  `);
  return stmt.get(album) as AlbumRecord;
}

export function getAlbumById(id: string): AlbumRecord | undefined {
  return db.prepare("SELECT * FROM albums WHERE id = ?").get(id) as AlbumRecord | undefined;
}

export function listAlbums(): AlbumRecord[] {
  return db.prepare("SELECT * FROM albums ORDER BY created_at DESC").all() as AlbumRecord[];
}

export function updateAlbumTitle(id: string, title: string): void {
  db.prepare("UPDATE albums SET title = ? WHERE id = ?").run(title, id);
}

export function setCoverPage(albumId: string, pageId: string | null): void {
  db.prepare("UPDATE albums SET cover_page = ? WHERE id = ?").run(pageId, albumId);
}

export function deleteAlbum(id: string): void {
  db.prepare("DELETE FROM albums WHERE id = ?").run(id);
}

export function listAlbumsPaginated(cursor: string | null, limit: number): AlbumRecord[] {
  if (cursor) {
    return db
      .prepare("SELECT * FROM albums WHERE created_at < ? ORDER BY created_at DESC LIMIT ?")
      .all(cursor, limit) as AlbumRecord[];
  }
  return db
    .prepare("SELECT * FROM albums ORDER BY created_at DESC LIMIT ?")
    .all(limit) as AlbumRecord[];
}
