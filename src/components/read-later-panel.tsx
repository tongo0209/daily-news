"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CLIENT_CATEGORY_META } from "@/lib/client-categories";
import { formatDateTime } from "@/lib/news/date";
import {
  getStorageSnapshot,
  parseReadLater,
  READ_LATER_KEY,
  subscribeStorageKey,
  writeReadLaterItems,
} from "@/lib/news/read-later";
import { NewsImage } from "@/components/news-image";
import { getClientSession } from "@/lib/client-session";

type RemoteBookmarkPayload = {
  items: Array<{
    createdAt: string;
    article: {
      slug: string;
      title: string;
      summary: string;
      source: {
        name: string;
      };
      publishedAt: string;
      category: string;
      imageUrl: string | null;
    };
  }>;
};

export function ReadLaterPanel() {
  const readLaterSnapshot = useSyncExternalStore(
    (onStoreChange) => subscribeStorageKey(READ_LATER_KEY, onStoreChange),
    () => getStorageSnapshot(READ_LATER_KEY),
    () => "",
  );

  const localItems = useMemo(() => {
    return parseReadLater(readLaterSnapshot);
  }, [readLaterSnapshot]);

  const sortedLocalItems = useMemo(() => {
    return [...localItems].sort((a, b) => {
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
  }, [localItems]);

  const [authKnown, setAuthKnown] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [remoteItems, setRemoteItems] = useState<typeof localItems | null>(null);

  const refreshRemoteItems = async () => {
    const response = await fetch("/api/bookmarks", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as RemoteBookmarkPayload;

    const mapped = data.items.map((item) => {
      return {
        slug: item.article.slug,
        title: item.article.title,
        summary: item.article.summary,
        sourceName: item.article.source.name,
        publishedAt: item.article.publishedAt,
        category: item.article.category,
        imageUrl: item.article.imageUrl,
        savedAt: item.createdAt,
      };
    });

    setRemoteItems(mapped);
  };

  useEffect(() => {
    let mounted = true;

    async function initAuthState() {
      try {
        const data = await getClientSession();

        if (!mounted) {
          return;
        }

        const authed = Boolean(data.user);
        setIsAuthed(authed);

        if (authed) {
          await refreshRemoteItems();
        } else {
          setRemoteItems(null);
        }
      } finally {
        if (mounted) {
          setAuthKnown(true);
        }
      }
    }

    void initAuthState();

    return () => {
      mounted = false;
    };
  }, []);

  const sortedItems = useMemo(() => {
    const base = isAuthed ? remoteItems ?? sortedLocalItems : sortedLocalItems;
    return [...base].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [isAuthed, remoteItems, sortedLocalItems]);

  const removeOne = async (slug: string) => {
    const next = localItems.filter((item) => item.slug !== slug);
    writeReadLaterItems(next);

    if (isAuthed) {
      await fetch(`/api/bookmarks?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      await refreshRemoteItems();
    }
  };

  const clearAll = async () => {
    writeReadLaterItems([]);

    if (isAuthed) {
      await fetch("/api/bookmarks", {
        method: "DELETE",
      });
      await refreshRemoteItems();
    }
  };

  if (sortedItems.length === 0) {
    return (
      <section className="news-shell rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-black text-slate-900">Danh sách đọc sau đang trống</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tại trang chủ hoặc trang bài viết, bấm &quot;Lưu đọc sau&quot; để gom bài quan trọng.
        </p>
        {authKnown && isAuthed ? (
          <p className="mt-1 text-xs text-slate-500">Dữ liệu đọc sau đang đồng bộ theo tài khoản của bạn.</p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Bài đã lưu ({sortedItems.length})</h2>
        {authKnown && isAuthed ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Đang đồng bộ đa thiết bị
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void clearAll()}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedItems.map((item) => {
          const label =
            CLIENT_CATEGORY_META[item.category as keyof typeof CLIENT_CATEGORY_META]?.label ??
            item.category;

          return (
            <article key={item.slug} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <NewsImage src={item.imageUrl} alt={item.title} className="mb-3 h-40" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label} · {formatDateTime(item.publishedAt)}
              </p>
              <h3 className="mt-2 text-base font-black text-slate-900">
                <Link href={`/article/${item.slug}`} className="hover:text-slate-700">
                  {item.title}
                </Link>
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.summary}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">{item.sourceName}</span>
                <button
                  type="button"
                  onClick={() => void removeOne(item.slug)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  Bỏ lưu
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
