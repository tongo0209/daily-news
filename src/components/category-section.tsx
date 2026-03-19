import Link from "next/link";
import { Category } from "@prisma/client";
import { ArticleCard } from "@/components/article-card";
import { categoryDescription, categoryLabel, categoryToSlug } from "@/lib/categories";
import type { ArticleWithSource } from "@/lib/news/query";

type CategorySectionProps = {
  category: Category;
  articles: ArticleWithSource[];
};

export function CategorySection({ category, articles }: CategorySectionProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="section-enter space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{categoryLabel(category)}</h2>
          <p className="text-sm text-slate-600">{categoryDescription(category)}</p>
        </div>
        <Link
          href={`/category/${categoryToSlug(category)}`}
          className="text-sm font-semibold text-slate-800 hover:underline"
        >
          Xem toàn bộ
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {articles.map((article) => {
          return <ArticleCard key={article.id} article={article} />;
        })}
      </div>
    </section>
  );
}
