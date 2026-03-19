"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CLIENT_CATEGORY_META, CLIENT_CATEGORY_ORDER } from "@/lib/client-categories";
import {
  getStorageSnapshot,
  parsePreferenceCategories,
  PREFERENCE_CATEGORIES_KEY,
  subscribeStorageKey,
  writePreferredCategories,
} from "@/lib/news/read-later";
import { formatDateTime } from "@/lib/news/date";
import { getClientSession } from "@/lib/client-session";

type DigestArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  publishedAt: string;
};

type PersonalizedDigestProps = {
  articles: DigestArticle[];
};

export function PersonalizedDigest({ articles }: PersonalizedDigestProps) {
  const defaultCategories = useMemo(() => CLIENT_CATEGORY_ORDER.slice(0, 3), []);
  const categorySnapshot = useSyncExternalStore(
    (onStoreChange) => subscribeStorageKey(PREFERENCE_CATEGORIES_KEY, onStoreChange),
    () => getStorageSnapshot(PREFERENCE_CATEGORIES_KEY),
    () => "",
  );

  const selectedCategories = useMemo(() => {
    if (!categorySnapshot) {
      return defaultCategories;
    }

    return parsePreferenceCategories(categorySnapshot);
  }, [categorySnapshot, defaultCategories]);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function syncFromAccount() {
      try {
        const session = await getClientSession();
        const categories = session.user?.preferredCategories ?? [];

        if (!mounted || categories.length === 0) {
          return;
        }

        writePreferredCategories(categories);
      } catch {
        // Ignore when user is not authenticated.
      }
    }

    void syncFromAccount();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    if (selectedCategories.length === 0) {
      return articles.slice(0, 6);
    }

    return articles
      .filter((article) => selectedCategories.includes(article.category))
      .slice(0, 6);
  }, [articles, selectedCategories]);

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];

    writePreferredCategories(next);
    void fetch("/api/preferences", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        preferredCategories: next,
      }),
    }).catch(() => {
      // Fallback to local-only preferences when not authenticated.
    });
  };

  const onCopyDigest = async () => {
    const lines = filteredArticles.slice(0, 5).map((article, index) => {
      const label =
        CLIENT_CATEGORY_META[article.category as keyof typeof CLIENT_CATEGORY_META]?.label ??
        article.category;

      return `${index + 1}. ${article.title} (${label} - ${article.sourceName})`;
    });

    if (lines.length === 0) {
      setCopyMessage("Chưa có bài phù hợp để tạo bản tin nhanh.");
      return;
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyMessage("Đã sao chép bản tin nhanh.");
    } catch {
      setCopyMessage("Không thể sao chép. Bạn thử lại giúp mình.");
    }
  };

  return (
    <section className="news-shell section-enter rounded-2xl p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Bản tin cá nhân hóa</h2>
          <p className="text-sm text-slate-600">Chọn chuyên mục bạn quan tâm để xem bản tin riêng.</p>
        </div>
        <button
          type="button"
          onClick={onCopyDigest}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
        >
          Tạo bản tin nhanh
        </button>
      </div>

      {copyMessage ? <p className="mt-2 text-xs text-slate-500">{copyMessage}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {CLIENT_CATEGORY_ORDER.map((category) => {
          const isActive = selectedCategories.includes(category);

          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {CLIENT_CATEGORY_META[category].label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredArticles.length === 0 ? (
          <p className="text-sm text-slate-600">Chưa có bài phù hợp với lựa chọn hiện tại.</p>
        ) : (
          filteredArticles.map((article) => {
            const label =
              CLIENT_CATEGORY_META[article.category as keyof typeof CLIENT_CATEGORY_META]?.label ??
              article.category;

            return (
              <article key={article.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label} · {formatDateTime(article.publishedAt)}
                </p>
                <h3 className="text-base font-black text-slate-900">
                  <Link href={`/article/${article.slug}`} className="hover:text-slate-700">
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{article.summary}</p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
