import { db } from "../db";

export function getOrCreateTag(name: string): number {
  const existing = db.prepare("SELECT id FROM tags WHERE name = ?").get(name) as { id: number } | undefined;
  if (existing) return existing.id;
  const result = db.prepare("INSERT INTO tags (name) VALUES (?) RETURNING id").get(name) as { id: number };
  return result.id;
}

export function searchTags(q: string, limit = 10): string[] {
  return (
    db
      .prepare("SELECT name FROM tags WHERE name LIKE ? ORDER BY name LIMIT ?")
      .all(`${q}%`, limit) as { name: string }[]
  ).map((r) => r.name);
}

export function getTagsForImage(imageId: string): string[] {
  return (
    db
      .prepare(
        "SELECT t.name FROM tags t JOIN image_tags it ON t.id = it.tag_id WHERE it.image_id = ? ORDER BY t.name"
      )
      .all(imageId) as { name: string }[]
  ).map((r) => r.name);
}

export function getTagsForAlbum(albumId: string): string[] {
  return (
    db
      .prepare(
        "SELECT t.name FROM tags t JOIN album_tags at ON t.id = at.tag_id WHERE at.album_id = ? ORDER BY t.name"
      )
      .all(albumId) as { name: string }[]
  ).map((r) => r.name);
}

export function setTagsForImage(imageId: string, tagNames: string[]): void {
  db.prepare("DELETE FROM image_tags WHERE image_id = ?").run(imageId);
  for (const name of tagNames) {
    const tagId = getOrCreateTag(name.trim().toLowerCase());
    db.prepare("INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)").run(imageId, tagId);
  }
}

export function setTagsForAlbum(albumId: string, tagNames: string[]): void {
  db.prepare("DELETE FROM album_tags WHERE album_id = ?").run(albumId);
  for (const name of tagNames) {
    const tagId = getOrCreateTag(name.trim().toLowerCase());
    db.prepare("INSERT OR IGNORE INTO album_tags (album_id, tag_id) VALUES (?, ?)").run(albumId, tagId);
  }
}
