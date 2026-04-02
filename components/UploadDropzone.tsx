"use client";
import { useCallback, useRef, useState } from "react";
import styles from "./UploadDropzone.module.css";

interface UploadProgress {
  name: string;
  progress: number;
  done: boolean;
  error?: string;
}

interface Props {
  albumId?: string;
  onUploaded: () => void;
}

export default function UploadDropzone({ albumId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (!fileArray.length) return;

      const url = albumId ? `/api/albums/${albumId}/pages` : `/api/images`;
      const fieldName = albumId ? "pages" : "images";

      setUploads(fileArray.map((f) => ({ name: f.name, progress: 0, done: false })));

      const formData = new FormData();
      for (const file of fileArray) {
        formData.append(fieldName, file);
      }

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) => prev.map((u) => ({ ...u, progress: pct })));
          }
        };
        xhr.onload = () => {
          setUploads((prev) => prev.map((u) => ({ ...u, progress: 100, done: true })));
          resolve();
        };
        xhr.onerror = () => {
          setUploads((prev) => prev.map((u) => ({ ...u, error: "Upload failed" })));
          resolve();
        };
        xhr.open("POST", url);
        xhr.send(formData);
      });

      onUploaded();
      setTimeout(() => setUploads([]), 2000);
    },
    [albumId, onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  return (
    <div
      className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />
      <div className={styles.label}>
        {dragging ? "Drop images here" : "Click or drag & drop images"}
      </div>

      {uploads.length > 0 && (
        <div className={styles.progressList} onClick={(e) => e.stopPropagation()}>
          {uploads.map((u, i) => (
            <div key={i} className={styles.progressItem}>
              <span className={styles.fileName}>{u.name}</span>
              {u.error ? (
                <span className={styles.error}>{u.error}</span>
              ) : (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${u.progress}%`, background: u.done ? "#4caf50" : "#4a9eff" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
