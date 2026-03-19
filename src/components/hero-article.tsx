import Link from "next/link";
import { categoryLabel, categoryToSlug } from "@/lib/categories";
import { formatDateTime } from "@/lib/news/date";
import { NewsImage } from "@/components/news-image";
import type { ArticleWithSource } from "@/lib/news/query";

type HeroArticleProps = {
  article: ArticleWithSource;
};

export function HeroArticle({ article }: HeroArticleProps) {
  return (
    <section className="section-enter grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1.2fr_1fr] md:p-7">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Tiêu điểm hôm nay
        </p>
        <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-4xl">
          <Link href={`/article/${article.slug}`} className="hover:text-slate-700">
            {article.title}
          </Link>
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 md:text-base">{article.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{formatDateTime(article.publishedAt)}</span>
          <span>{article.source.name}</span>
          <Link
            href={`/category/${categoryToSlug(article.category)}`}
            className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:border-slate-500"
          >
            {categoryLabel(article.category)}
          </Link>
        </div>
      </div>

      <NewsImage
        src={article.imageUrl}
        alt={article.title}
        fallbackText="Tin nổi bật"
        className="h-60 md:h-full"
      />
    </section>
  );
}
