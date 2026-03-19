import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { FilterToolbar } from "@/components/filter-toolbar";
import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";
import {
  categoryDescription,
  categoryFromSlug,
  categoryLabel,
  categoryToSlug,
} from "@/lib/categories";
import {
  getCategoryPageData,
  getSourceOptions,
  normalizeWindow,
} from "@/lib/news/query";
import { getCurrentUser } from "@/lib/auth/session";

export const revalidate = 900;

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    source?: string;
    window?: string;
  }>;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const currentUser = await getCurrentUser();
  const { category: categorySlug } = await params;
  const { page: pageText = "1", q = "", source = "", window = "all" } = await searchParams;

  const category = categoryFromSlug(categorySlug);

  if (!category) {
    notFound();
  }

  const pageNumber = Number.parseInt(pageText, 10);
  const normalizedWindow = normalizeWindow(window);
  const sourceId = source.trim();

  const [data, sourceOptions] = await Promise.all([
    getCategoryPageData(category, pageNumber, undefined, {
      sourceId,
      window: normalizedWindow,
    }),
    getSourceOptions(),
  ]);

  const buildPageLink = (page: number) => {
    const query = new URLSearchParams();
    query.set("page", String(page));

    if (q.trim()) {
      query.set("q", q.trim());
    }

    if (sourceId) {
      query.set("source", sourceId);
    }

    if (normalizedWindow !== "all") {
      query.set("window", normalizedWindow);
    }

    return `/category/${categoryToSlug(category)}?${query.toString()}`;
  };

  return (
    <div className="min-h-screen">
      <SiteHeader activeCategory={category} currentUser={currentUser} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <section className="news-shell section-enter rounded-2xl p-6">
          <h1 className="text-3xl font-black text-slate-900">{categoryLabel(category)}</h1>
          <p className="mt-2 text-sm text-slate-600">{categoryDescription(category)}</p>
          <div className="mt-4">
            <SearchForm
              action="/"
              initialValue={q}
              hiddenFields={{
                source: sourceId || undefined,
                window: normalizedWindow !== "all" ? normalizedWindow : undefined,
              }}
            />
          </div>
        </section>

        <FilterToolbar
          actionPath={`/category/${categoryToSlug(category)}`}
          sourceOptions={sourceOptions}
          selectedSourceId={sourceId}
          selectedWindow={normalizedWindow}
          keyword={q}
        />

        {data.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Chưa có bài viết cho chuyên mục này.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((article) => {
                return <ArticleCard key={article.id} article={article} />;
              })}
            </div>

            <div className="section-enter flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <span>
                Trang {data.page}/{data.totalPages} · {data.total} bài
              </span>
              <div className="flex items-center gap-3">
                {data.page > 1 ? (
                  <Link
                    href={buildPageLink(data.page - 1)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                  >
                    Trang trước
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 font-semibold text-slate-400">
                    Trang trước
                  </span>
                )}
                {data.page < data.totalPages ? (
                  <Link
                    href={buildPageLink(data.page + 1)}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                  >
                    Trang sau
                  </Link>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 font-semibold text-slate-400">
                    Trang sau
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
