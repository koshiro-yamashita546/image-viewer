import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function getDb(): Database.Database {
  const storagePath = process.env.STORAGE_PATH;
  if (!storagePath) throw new Error("STORAGE_PATH env var is not set");

  fs.mkdirSync(storagePath, { recursive: true });
  const dbPath = path.join(storagePath, "image-viewer.db");

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_path TEXT NOT NULL,
      webp_path TEXT NOT NULL,
      thumbnail_path TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cover_page TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS album_pages (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      page_order REAL NOT NULL,
      filename TEXT NOT NULL,
      original_path TEXT NOT NULL,
      webp_path TEXT NOT NULL,
      thumbnail_path TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS image_tags (
      image_id TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (image_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS album_tags (
      album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (album_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_album_pages_album_id ON album_pages(album_id);
    CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
    CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at);
    CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
    CREATE INDEX IF NOT EXISTS idx_album_tags_album_id ON album_tags(album_id);
  `);

  // Migration: add sort_order to images if missing
  try {
    db.exec("ALTER TABLE images ADD COLUMN sort_order REAL");
    // Backfill existing rows with created_at as epoch seconds
    db.exec("UPDATE images SET sort_order = unixepoch(created_at) WHERE sort_order IS NULL");
  } catch {
    // Column already exists — ignore
  }

  return db;
}

// Singleton with dev hot-reload safety
declare global {
  // eslint-disable-next-line no-var
  var _imageViewerDb: Database.Database | undefined;
}

export const db: Database.Database =
  globalThis._imageViewerDb ?? getDb();

if (process.env.NODE_ENV !== "production") {
  globalThis._imageViewerDb = db;
}
