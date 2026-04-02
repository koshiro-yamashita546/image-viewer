"use client";
import { useState, useCallback, useRef } from "react";
import GalleryItem from "./GalleryItem";
import LoadMoreSentinel from "./LoadMoreSentinel";
import PhotoSwipeLightbox from "./PhotoSwipeLightbox";
import TagInput from "./TagInput";
import type { GalleryItem as GalleryItemType } from "@/app/api/gallery/route";
import styles from "./GalleryGrid.module.css";

interface Props {
  initialItems: GalleryItemType[];
  initialCursor: string | null;
}

export default function GalleryGrid({ initialItems, initialCursor }: Props) {
  const [items, setItems] = useState<GalleryItemType[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<GalleryItemType | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const activeTagsRef = useRef<string[]>([]);

  const fetchItems = useCallback(async (tags: string[], cur: string | null, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (cur) params.set("cursor", cur);
      if (tags.length) params.set("tags", tags.join(","));
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      setItems((prev) => append ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, []);

  const onTagsChange = useCallback((tags: string[]) => {
    setFilterTags(tags);
    activeTagsRef.current = tags;
    fetchItems(tags, null, false);
  }, [fetchItems]);

  const loadMore = useCallback(() => {
    if (loading || cursor === null) return;
    fetchItems(activeTagsRef.current, cursor, true);
  }, [loading, cursor, fetchItems]);

  return (
    <>
      <div className={styles.searchBar}>
        <TagInput
          value={filterTags}
          onChange={onTagsChange}
          placeholder="タグで絞り込み..."
        />
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <GalleryItem
            key={`${item.type}-${item.id}`}
            item={item}
            onImageClick={setLightboxItem}
          />
        ))}
        {items.length === 0 && !loading && (
          <div className={styles.empty}>画像がありません</div>
        )}
      </div>

      {cursor !== null && (
        <LoadMoreSentinel onVisible={loadMore} loading={loading} />
      )}

      {lightboxItem && (
        <PhotoSwipeLightbox
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      )}
    </>
  );
}
