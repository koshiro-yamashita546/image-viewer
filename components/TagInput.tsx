"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./TagInput.module.css";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder = "タグを追加..." }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const filtered = (data.tags as string[]).filter((t) => !value.includes(t));
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    }, 150);
  }, [value]);

  useEffect(() => {
    fetchSuggestions(input);
  }, [input, fetchSuggestions]);

  function addTag(tag: string) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || value.includes(normalized)) return;
    onChange([...value, normalized]);
    setInput("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.field} onClick={() => inputRef.current?.focus()}>
        {value.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => input && fetchSuggestions(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className={styles.input}
        />
      </div>
      {open && (
        <ul className={styles.suggestions}>
          {suggestions.map((s) => (
            <li key={s} onMouseDown={() => addTag(s)} className={styles.suggestion}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
