import Link from "next/link";
import { BookmarkButton } from "@/components/bookmark-button";
import { categoryLabel, categoryToSlug } from "@/lib/categories";
import { formatDateTime } from "@/lib/news/date";
import { buildQuickSummary } from "@/lib/news/quick-summary";
import { NewsImage } from "@/components/news-image";
import { getVerificationBadge, type ArticleWithSource } from "@/lib/news/query";

type ArticleCardProps = {
  article: ArticleWithSource;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const quickBullets = buildQuickSummary(article.summary, article.content, 2);
  const verification = getVerificationBadge(article.sourceConfirmCount);

  return (
    <article className="section-enter flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <NewsImage
        src={article.imageUrl}
        alt={article.title}
        fallbackText={categoryLabel(article.category)}
        className="mb-4 h-44"
      />

      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          {categoryLabel(article.category)}
        </span>
        <span>{formatDateTime(article.publishedAt)}</span>
      </div>

      <p
        className={`mb-2 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
          verification.level === "high"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : verification.level === "medium"
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-rose-300 bg-rose-50 text-rose-700"
        }`}
      >
        {verification.label} ({verification.sourceCount})
      </p>

      <h3 className="text-lg font-black leading-snug text-slate-900">
        <Link href={`/article/${article.slug}`} className="hover:text-slate-700">
          {article.title}
        </Link>
      </h3>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{article.summary}</p>

      <section className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Đọc nhanh 30s</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {quickBullets.map((bullet) => {
            return (
              <li key={bullet} className="line-clamp-2">
                - {bullet}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-auto pt-4 text-sm text-slate-500">
        <p>
          Nguồn: <span className="font-semibold text-slate-700">{article.source.name}</span>
        </p>
        <Link
          href={`/category/${categoryToSlug(article.category)}`}
          className="mt-2 inline-block font-semibold text-slate-800 hover:underline"
        >
          Xem thêm chuyên mục
        </Link>

        <div className="mt-3">
          <BookmarkButton
            item={{
              slug: article.slug,
              title: article.title,
              summary: article.summary,
              sourceName: article.source.name,
              publishedAt: article.publishedAt.toISOString(),
              category: article.category,
              imageUrl: article.imageUrl,
            }}
          />
        </div>
      </div>
    </article>
  );
}
