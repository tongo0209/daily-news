import Link from "next/link";
import { CategorySection } from "@/components/category-section";
import { HeroArticle } from "@/components/hero-article";
import { FilterToolbar } from "@/components/filter-toolbar";
import { PersonalizedDigest } from "@/components/personalized-digest";
import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";
import { ArticleCard } from "@/components/article-card";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getEventClusters,
  getHomeSections,
  getSourceOptions,
  getTrendingTopics,
  normalizeWindow,
  searchArticles,
} from "@/lib/news/query";

export const revalidate = 900;

type HomePageProps = {
  searchParams: Promise<{
    q?: string;
    source?: string;
    window?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const currentUser = await getCurrentUser();
  const { q = "", source = "", window = "all" } = await searchParams;
  const keyword = q.trim();
  const normalizedWindow = normalizeWindow(window);
  const sourceId = source.trim();
  const filters = {
    sourceId,
    window: normalizedWindow,
  };

  const [sourceOptions, homeData, trendingTopics, eventClusters, searchResults] = await Promise.all([
    getSourceOptions(),
    keyword ? null : getHomeSections(filters, currentUser?.id),
    keyword ? [] : getTrendingTopics(filters, 4),
    keyword ? [] : getEventClusters(filters, 6),
    keyword ? searchArticles(keyword, 30, filters, currentUser?.id) : [],
  ]);

  const digestArticles =
    homeData?.latest.map((item) => {
      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        category: item.category,
        sourceName: item.source.name,
        publishedAt: item.publishedAt.toISOString(),
      };
    }) ?? [];

  return (
    <div className="min-h-screen">
      <SiteHeader currentUser={currentUser} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
        <section className="news-shell section-enter rounded-2xl p-5 md:p-6">
          <div className="mb-4 flex flex-col gap-2">
            <h2 className="text-2xl font-black text-slate-900">Dòng sự kiện trong ngày</h2>
            <p className="text-sm text-slate-600">
              Tổng hợp tin mới bằng tiếng Việt, ưu tiên nguồn trong nước theo từng chuyên mục.
            </p>
          </div>
          <SearchForm
            initialValue={keyword}
            action="/"
            hiddenFields={{
              source: sourceId || undefined,
              window: normalizedWindow !== "all" ? normalizedWindow : undefined,
            }}
          />
        </section>

        <FilterToolbar
          actionPath="/"
          sourceOptions={sourceOptions}
          selectedSourceId={sourceId}
          selectedWindow={normalizedWindow}
          keyword={keyword}
        />

        {keyword ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h1 className="text-2xl font-black">Kết quả tìm kiếm: &quot;{keyword}&quot;</h1>
              <span className="text-sm text-slate-500">{searchResults.length} bài</span>
            </div>

            {searchResults.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                Chưa tìm thấy bài viết phù hợp.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((article) => {
                  return <ArticleCard key={article.id} article={article} />;
                })}
              </div>
            )}
          </section>
        ) : homeData?.headline ? (
          <>
            <HeroArticle article={homeData.headline} />

            <section className="space-y-4">
              <h2 className="text-2xl font-black">Tin mới cập nhật</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {homeData.latest.slice(0, 12).map((article) => {
                  return <ArticleCard key={article.id} article={article} />;
                })}
              </div>
            </section>

            <PersonalizedDigest articles={digestArticles} />

            {eventClusters.length > 0 ? (
              <section className="news-shell section-enter rounded-2xl p-5 md:p-6">
                <h2 className="text-2xl font-black text-slate-900">Sự kiện nhiều báo cùng đưa</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Hệ thống gom các bài trùng sự kiện để bạn theo dõi nhanh, tránh đọc lặp.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {eventClusters.map((cluster) => {
                    return (
                      <article key={cluster.signature} className="rounded-xl border border-slate-200 bg-white p-4">
                        <Link
                          href={`/article/${cluster.representative.slug}`}
                          className="line-clamp-2 text-base font-black text-slate-900 hover:text-slate-700"
                        >
                          {cluster.title}
                        </Link>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {cluster.sourceCount} nguồn · {cluster.articleCount} bài
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {cluster.articles.slice(0, 3).map((item) => {
                            return (
                              <li key={item.id}>
                                <Link href={`/article/${item.slug}`} className="font-semibold hover:underline">
                                  {item.title}
                                </Link>
                                <span className="ml-2 text-slate-500">({item.source.name})</span>
                              </li>
                            );
                          })}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {trendingTopics.length > 0 ? (
              <section className="news-shell section-enter rounded-2xl p-5 md:p-6">
                <h2 className="text-2xl font-black text-slate-900">Chủ đề nhiều báo cùng nói</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {trendingTopics.map((topic) => {
                    return (
                      <article key={topic.signature} className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-base font-black text-slate-900 line-clamp-2">{topic.title}</h3>
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {topic.articles.map((item) => {
                            return (
                              <li key={item.id}>
                                <Link href={`/article/${item.slug}`} className="font-semibold hover:underline">
                                  {item.title}
                                </Link>
                                <span className="ml-2 text-slate-500">({item.source.name})</span>
                              </li>
                            );
                          })}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <div className="space-y-8">
              {homeData.sections.map((section) => {
                return (
                  <CategorySection
                    key={section.category}
                    category={section.category}
                    articles={section.articles}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <section className="news-shell section-enter rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-black">Chưa có dữ liệu tin tức</h1>
            <p className="mt-2 text-sm text-slate-600">
              Vào trang Tòa soạn và bấm &quot;Cập nhật tin ngay&quot; để nạp dữ liệu lần đầu.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
