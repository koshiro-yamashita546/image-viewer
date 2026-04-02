import path from "path";
import fs from "fs";

export function getStoragePath(): string {
  const p = process.env.STORAGE_PATH;
  if (!p) throw new Error("STORAGE_PATH env var is not set");
  return p;
}

export function ensureStorageDirs(): void {
  const base = getStoragePath();
  const dirs = [
    "originals/single",
    "originals/albums",
    "webp/single",
    "webp/albums",
    "thumbnails/single",
    "thumbnails/albums",
  ];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(base, dir), { recursive: true });
  }
}

export function getOriginalSinglePath(filename: string): string {
  return path.join(getStoragePath(), "originals", "single", filename);
}

export function getOriginalAlbumPath(albumId: string, filename: string): string {
  return path.join(getStoragePath(), "originals", "albums", albumId, filename);
}

export function getWebpSinglePath(filename: string): string {
  return path.join(getStoragePath(), "webp", "single", filename);
}

export function getWebpAlbumPath(albumId: string, filename: string): string {
  return path.join(getStoragePath(), "webp", "albums", albumId, filename);
}

export function getThumbnailSinglePath(filename: string): string {
  return path.join(getStoragePath(), "thumbnails", "single", filename);
}

export function getThumbnailAlbumPath(albumId: string, filename: string): string {
  return path.join(getStoragePath(), "thumbnails", "albums", albumId, filename);
}

export function ensureAlbumDirs(albumId: string): void {
  const base = getStoragePath();
  fs.mkdirSync(path.join(base, "originals", "albums", albumId), { recursive: true });
  fs.mkdirSync(path.join(base, "webp", "albums", albumId), { recursive: true });
  fs.mkdirSync(path.join(base, "thumbnails", "albums", albumId), { recursive: true });
}

/**
 * Validate that a resolved path is within STORAGE_PATH to prevent traversal attacks.
 */
export function assertWithinStorage(resolvedPath: string): void {
  const base = path.resolve(getStoragePath());
  const resolved = path.resolve(resolvedPath);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error("Path traversal detected");
  }
}
