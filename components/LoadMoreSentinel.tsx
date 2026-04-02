"use client";
import { useEffect, useRef } from "react";

interface Props {
  onVisible: () => void;
  loading: boolean;
}

export default function LoadMoreSentinel({ onVisible, loading }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onVisible();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, loading]);

  return (
    <div ref={ref} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {loading && <span style={{ color: "#888", fontSize: 14 }}>Loading...</span>}
    </div>
  );
}
