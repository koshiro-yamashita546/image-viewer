"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import UploadDropzone from "@/components/UploadDropzone";
import TagInput from "@/components/TagInput";
import styles from "./manage.module.css";

interface Album {
  id: string;
  title: string;
  page_count: number;
  cover_thumbnail_url: string | null;
  created_at: string;
}

interface AlbumPage {
  id: string;
  page_order: number;
  thumbnail_url: string;
  webp_url: string;
  width: number;
  height: number;
}

interface RecentImage {
  id: string;
  thumbnail_url: string;
  tags: string[];
  sort_order: number;
}

export default function ManageClient() {
  const [tab, setTab] = useState<"singles" | "albums">("singles");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [albumPages, setAlbumPages] = useState<AlbumPage[]>([]);
  const [albumTags, setAlbumTags] = useState<string[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [images, setImages] = useState<RecentImage[]>([]);
  const [editingImageTags, setEditingImageTags] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);

  // Drag state
  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    fetch("/api/albums")
      .then((r) => r.json())
      .then((d) => setAlbums(d.albums ?? []));
  }, [refreshKey]);

  useEffect(() => {
    fetch("/api/gallery?limit=200")
      .then((r) => r.json())
      .then((d) => {
        const singles = (d.items ?? []).filter((i: { type: string }) => i.type === "image");
        setImages(singles.map((i: { id: string; thumbnail_url: string; tags: string[]; sort_order?: number }) => ({
          id: i.id,
          thumbnail_url: i.thumbnail_url,
          tags: i.tags ?? [],
          sort_order: i.sort_order ?? 0,
        })));
      });
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedAlbum) return;
    fetch(`/api/albums/${selectedAlbum}/pages`)
      .then((r) => r.json())
      .then((d) => setAlbumPages(d.pages ?? []));
  }, [selectedAlbum, refreshKey]);

  useEffect(() => {
    if (!selectedAlbum) { setAlbumTags([]); return; }
    fetch(`/api/gallery?limit=200`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.items ?? []).find(
          (i: { type: string; id: string; tags: string[] }) => i.type === "album" && i.id === selectedAlbum
        );
        setAlbumTags(found?.tags ?? []);
      });
  }, [selectedAlbum, refreshKey]);

  async function deleteImage(id: string) {
    await fetch(`/api/images/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function saveAlbumTags(tags: string[]) {
    if (!selectedAlbum) return;
    setAlbumTags(tags);
    await fetch(`/api/albums/${selectedAlbum}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
  }

  async function saveImageTags(imageId: string, tags: string[]) {
    await fetch(`/api/images/${imageId}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, tags } : img)));
    setEditingImageTags(null);
  }

  // --- Drag & Drop ---
  function onDragStart(id: string) {
    dragIdRef.current = id;
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setDragOverId(id);
  }

  function onDragLeave() {
    setDragOverId(null);
  }

  async function onDrop(targetId: string) {
    setDragOverId(null);
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) return;
    dragIdRef.current = null;

    const fromIdx = images.findIndex((img) => img.id === fromId);
    const toIdx = images.findIndex((img) => img.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    // Swap sort_order values
    const fromOrder = images[fromIdx].sort_order;
    const toOrder = images[toIdx].sort_order;

    const reordered = images.map((img) => {
      if (img.id === fromId) return { ...img, sort_order: toOrder };
      if (img.id === targetId) return { ...img, sort_order: fromOrder };
      return img;
    });
    // Re-sort by new sort_order
    reordered.sort((a, b) => a.sort_order - b.sort_order);
    setImages(reordered);

    await Promise.all([
      fetch(`/api/images/${fromId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: toOrder }),
      }),
      fetch(`/api/images/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: fromOrder }),
      }),
    ]);
  }

  // --- Album operations ---
  async function createAlbum() {
    if (!newAlbumTitle.trim()) return;
    const res = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newAlbumTitle.trim() }),
    });
    const data = await res.json();
    setNewAlbumTitle("");
    setSelectedAlbum(data.album.id);
    refresh();
  }

  async function deleteAlbum(id: string) {
    if (!confirm("このアルバムと全ページを削除しますか？")) return;
    await fetch(`/api/albums/${id}`, { method: "DELETE" });
    if (selectedAlbum === id) setSelectedAlbum(null);
    refresh();
  }

  async function setCover(pageId: string) {
    if (!selectedAlbum) return;
    await fetch(`/api/albums/${selectedAlbum}/cover`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: pageId }),
    });
    refresh();
  }

  async function deletePage(pageId: string) {
    if (!selectedAlbum) return;
    await fetch(`/api/albums/${selectedAlbum}/pages/${pageId}`, { method: "DELETE" });
    refresh();
  }

  async function movePage(pageId: string, direction: "up" | "down") {
    const idx = albumPages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= albumPages.length) return;
    const a = albumPages[idx];
    const b = albumPages[swapIdx];
    await Promise.all([
      fetch(`/api/albums/${selectedAlbum}/pages/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.page_order }),
      }),
      fetch(`/api/albums/${selectedAlbum}/pages/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.page_order }),
      }),
    ]);
    refresh();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Manage</h1>
        <a href="/" className={styles.backLink}>← Gallery</a>
      </header>

      <div className={styles.tabs}>
        <button className={tab === "singles" ? styles.activeTab : styles.tab} onClick={() => setTab("singles")}>
          単体画像
        </button>
        <button className={tab === "albums" ? styles.activeTab : styles.tab} onClick={() => setTab("albums")}>
          アルバム
        </button>
      </div>

      {tab === "singles" && (
        <section className={styles.section}>
          <h2>アップロード</h2>
          <UploadDropzone onUploaded={refresh} />

          {images.length > 0 && (
            <>
              <h2 style={{ marginTop: 24 }}>画像 ({images.length})</h2>
              <p className={styles.hint}>ドラッグで並び替え・ホバーで削除</p>
              <div className={styles.pageGrid}>
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`${styles.pageCard} ${dragOverId === img.id ? styles.dragOver : ""}`}
                    draggable
                    onDragStart={() => onDragStart(img.id)}
                    onDragOver={(e) => onDragOver(e, img.id)}
                    onDragLeave={onDragLeave}
                    onDrop={() => onDrop(img.id)}
                    onDragEnd={() => setDragOverId(null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.thumbnail_url} alt="" className={styles.pageThumb} />
                    <button
                      className={styles.hoverDelete}
                      onClick={() => deleteImage(img.id)}
                      title="削除"
                    >×</button>
                    <div className={styles.tagArea}>
                      {editingImageTags === img.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <TagInput value={editingTags} onChange={setEditingTags} placeholder="タグ..." />
                          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                            <button className={styles.saveBtnSm} onClick={() => saveImageTags(img.id, editingTags)}>保存</button>
                            <button className={styles.cancelBtnSm} onClick={() => setEditingImageTags(null)}>×</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={styles.tagChips}
                          onClick={() => { setEditingImageTags(img.id); setEditingTags(img.tags); }}
                        >
                          {img.tags.length > 0
                            ? img.tags.map((t) => <span key={t} className={styles.chip}>{t}</span>)
                            : <span className={styles.addTagHint}>+ タグ</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "albums" && (
        <section className={styles.section}>
          <div className={styles.albumLayout}>
            <div className={styles.albumList}>
              <h2>アルバム</h2>
              <div className={styles.newAlbum}>
                <input
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  placeholder="アルバムタイトル"
                  className={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && createAlbum()}
                />
                <button className={styles.btn} onClick={createAlbum}>作成</button>
              </div>
              {albums.map((album) => (
                <div
                  key={album.id}
                  className={`${styles.albumRow} ${selectedAlbum === album.id ? styles.selectedRow : ""}`}
                  onClick={() => setSelectedAlbum(album.id)}
                >
                  {album.cover_thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_thumbnail_url} alt="" className={styles.albumRowThumb} />
                  )}
                  <div className={styles.albumRowInfo}>
                    <div className={styles.albumRowTitle}>{album.title}</div>
                    <div className={styles.albumRowMeta}>{album.page_count} pages</div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); deleteAlbum(album.id); }}
                  >×</button>
                </div>
              ))}
            </div>

            {selectedAlbum && (
              <div className={styles.albumDetail}>
                <h2>{albums.find((a) => a.id === selectedAlbum)?.title}</h2>
                <div className={styles.albumTagSection}>
                  <label className={styles.tagLabel}>タグ</label>
                  <TagInput value={albumTags} onChange={saveAlbumTags} placeholder="タグを追加..." />
                </div>
                <UploadDropzone albumId={selectedAlbum} onUploaded={refresh} />
                <div className={styles.pageGrid}>
                  {albumPages.map((page, idx) => (
                    <div key={page.id} className={styles.pageCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={page.thumbnail_url} alt="" className={styles.pageThumb} />
                      <div className={styles.pageActions}>
                        <span className={styles.pageNum}>{idx + 1}</span>
                        <button onClick={() => movePage(page.id, "up")} disabled={idx === 0}>↑</button>
                        <button onClick={() => movePage(page.id, "down")} disabled={idx === albumPages.length - 1}>↓</button>
                        <button onClick={() => setCover(page.id)} title="カバーに設定">⭐</button>
                        <button onClick={() => deletePage(page.id)} className={styles.deleteBtnSm}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
