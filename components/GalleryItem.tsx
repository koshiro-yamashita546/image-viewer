"use client";
import Link from "next/link";
import type { GalleryItem as GalleryItemType } from "@/app/api/gallery/route";
import styles from "./GalleryItem.module.css";

interface Props {
  item: GalleryItemType;
  onImageClick: (item: GalleryItemType) => void;
}

export default function GalleryItem({ item, onImageClick }: Props) {
  if (item.type === "image") {
    return (
      <button className={styles.cell} onClick={() => onImageClick(item)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail_url}
          alt=""
          className={styles.img}
          loading="lazy"
        />
      </button>
    );
  }

  return (
    <Link href={`/albums/${item.id}`} className={styles.cell}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnail_url}
        alt={item.title ?? "Album"}
        className={styles.img}
        loading="lazy"
      />
      <div className={styles.albumBadge}>{item.page_count}</div>
    </Link>
  );
}
