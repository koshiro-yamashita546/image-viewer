"use client";
import { useEffect, useRef } from "react";

interface AlbumPage {
  id: string;
  webp_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
}

interface Props {
  pages: AlbumPage[];
  title: string;
}

export default function AlbumViewer({ pages, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    async function open() {
      const { default: PhotoSwipe } = await import("photoswipe");
      await import("photoswipe/style.css");

      const dataSource = pages.map((p) => ({
        src: p.webp_url,
        width: p.width,
        height: p.height,
        alt: title,
      }));

      const pswp = new PhotoSwipe({
        dataSource,
        index: 0,
        loop: false,
        zoom: true,
        close: true,
        counter: true,
        arrowKeys: true,
        // Prevent navigating away on close since we're on a dedicated page
        appendToEl: containerRef.current ?? undefined,
      });

      pswp.on("close", () => {
        // Navigate back to gallery on close
        window.history.back();
      });

      pswp.init();
    }

    open();
  }, [pages, title]);

  return <div ref={containerRef} />;
}
