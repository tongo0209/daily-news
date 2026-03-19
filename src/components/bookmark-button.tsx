"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getStorageSnapshot,
  parseReadLater,
  READ_LATER_KEY,
  subscribeStorageKey,
  type ReadLaterItem,
  writeReadLaterItems,
} from "@/lib/news/read-later";
import { getClientSession } from "@/lib/client-session";

type BookmarkButtonProps = {
  item: Omit<ReadLaterItem, "savedAt">;
  size?: "sm" | "md";
};

export function BookmarkButton({ item, size = "sm" }: BookmarkButtonProps) {
  const readLaterSnapshot = useSyncExternalStore(
    (onStoreChange) => subscribeStorageKey(READ_LATER_KEY, onStoreChange),
    () => getStorageSnapshot(READ_LATER_KEY),
    () => "",
  );

  const saved = useMemo(() => {
    return parseReadLater(readLaterSnapshot).some((entry) => entry.slug === item.slug);
  }, [item.slug, readLaterSnapshot]);

  const [authKnown, setAuthKnown] = useState(false);
  const [remoteSaved, setRemoteSaved] = useState<boolean | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  const currentItems = useMemo(() => {
    return parseReadLater(readLaterSnapshot);
  }, [readLaterSnapshot]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const data = await getClientSession();

        if (!mounted) {
          return;
        }

        setIsAuthed(Boolean(data.user));
      } finally {
        if (mounted) {
          setAuthKnown(true);
        }
      }
    }

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadRemoteSaved() {
      if (!isAuthed) {
        setRemoteSaved(null);
        return;
      }

      try {
        const response = await fetch(`/api/bookmarks?slug=${encodeURIComponent(item.slug)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { saved?: boolean };

        if (!mounted) {
          return;
        }

        setRemoteSaved(Boolean(data.saved));
      } catch {
        if (mounted) {
          setRemoteSaved(null);
        }
      }
    }

    void loadRemoteSaved();

    return () => {
      mounted = false;
    };
  }, [isAuthed, item.slug]);

  const effectiveSaved = isAuthed ? (remoteSaved ?? saved) : saved;

  const buttonClass = useMemo(() => {
    const base =
      "inline-flex items-center justify-center rounded-xl border font-semibold transition-colors";

    const dimension =
      size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";

    const palette = effectiveSaved
      ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
      : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white";

    return `${base} ${dimension} ${palette}`;
  }, [effectiveSaved, size]);

  const onToggle = async () => {
    const existsLocally = currentItems.some((entry) => entry.slug === item.slug);
    const isCurrentlySaved = isAuthed ? effectiveSaved : existsLocally;

    const next = isCurrentlySaved
      ? currentItems.filter((entry) => entry.slug !== item.slug)
      : [{ ...item, savedAt: new Date().toISOString() }, ...currentItems];

    writeReadLaterItems(next);

    if (isAuthed) {
      try {
        const action = isCurrentlySaved ? "remove" : "save";
        const response = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            slug: item.slug,
            action,
          }),
        });

        if (response.ok) {
          setRemoteSaved(!isCurrentlySaved);
        }
      } catch {
        // Keep local state as fallback when sync fails.
      }
    }
  };

  return (
    <button type="button" className={buttonClass} onClick={() => void onToggle()}>
      {effectiveSaved ? "Đã lưu" : authKnown && isAuthed ? "Lưu & đồng bộ" : "Lưu đọc sau"}
    </button>
  );
}
