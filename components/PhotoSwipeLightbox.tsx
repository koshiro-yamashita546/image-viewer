"use client";
import { useEffect, useRef } from "react";
import type { GalleryItem } from "@/app/api/gallery/route";

interface Props {
  item: GalleryItem;
  onClose: () => void;
}

export default function PhotoSwipeLightbox({ item, onClose }: Props) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function open() {
      const { default: PhotoSwipe } = await import("photoswipe");
      await import("photoswipe/style.css");

      const pswp = new PhotoSwipe({
        dataSource: [
          {
            src: item.webp_url,
            width: item.width,
            height: item.height,
            alt: item.tags?.join(", ") ?? "",
          },
        ],
        index: 0,
        loop: false,
        zoom: true,
        close: true,
        counter: false,
        arrowKeys: true,
      });

      // タグをフッターとして表示
      if (item.tags && item.tags.length > 0) {
        pswp.on("uiRegister", () => {
          pswp.ui?.registerElement({
            name: "tags-bar",
            order: 9,
            isButton: false,
            appendTo: "root",
            html: "",
            onInit: (el) => {
              el.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 10px 16px;
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                pointer-events: none;
                background: linear-gradient(transparent, rgba(0,0,0,0.6));
              `;
              el.innerHTML = (item.tags ?? [])
                .map(
                  (t) =>
                    `<span style="
                      background: rgba(74,158,255,0.25);
                      color: #7bbfff;
                      border: 1px solid rgba(74,158,255,0.4);
                      border-radius: 12px;
                      padding: 2px 10px;
                      font-size: 12px;
                      white-space: nowrap;
                    ">${t}</span>`
                )
                .join("");
            },
          });
        });
      }

      pswp.on("close", () => onClose());
      pswp.init();
    }

    open();
  }, [item, onClose]);

  return null;
}
