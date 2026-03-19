import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/components/bookmark-button";
import { SiteHeader } from "@/components/site-header";
import { NewsImage } from "@/components/news-image";
import { getCurrentUser } from "@/lib/auth/session";
import { categoryLabel, categoryToSlug } from "@/lib/categories";
import { formatDateTime } from "@/lib/news/date";
import { buildInsightSummary } from "@/lib/news/quick-summary";
import {
  getArticleBySlug,
  getRelatedByTopic,
  getVerificationBadge,
  recordArticleView,
} from "@/lib/news/query";

export const revalidate = 900;

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Không tìm thấy bài viết",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const pageUrl = `${siteUrl}/article/${article.slug}`;

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "article",
      locale: "vi_VN",
      title: article.title,
      description: article.summary,
      url: pageUrl,
      siteName: "Tin Việt Mỗi Ngày",
      publishedTime: article.publishedAt.toISOString(),
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: article.imageUrl ? [article.imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const currentUser = await getCurrentUser();
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const insightSummary = buildInsightSummary(article.summary, article.content);
  const relatedByTopic = await getRelatedByTopic(article, 4);
  const verificationBadge = getVerificationBadge(article.sourceConfirmCount);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: `${siteUrl}/article/${article.slug}`,
    inLanguage: "vi-VN",
    publisher: {
      "@type": "Organization",
      name: "Tin Việt Mỗi Ngày",
    },
    author: {
      "@type": "Organization",
      name: article.source.name,
    },
    image: article.imageUrl ? [article.imageUrl] : undefined,
  };

  if (currentUser) {
    await recordArticleView(currentUser.id, article.id);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader activeCategory={article.category} currentUser={currentUser} />

      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article className="section-enter rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Link
              href={`/category/${categoryToSlug(article.category)}`}
              className="rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:border-slate-600"
            >
              {categoryLabel(article.category)}
            </Link>
            <span>{formatDateTime(article.publishedAt)}</span>
            <span>{article.source.name}</span>
            <span
              className={`rounded-full border px-2 py-1 ${
                verificationBadge.level === "high"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : verificationBadge.level === "medium"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-rose-300 bg-rose-50 text-rose-700"
              }`}
            >
              {verificationBadge.label}
            </span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">{article.title}</h1>

          <NewsImage
            src={article.imageUrl}
            alt={article.title}
            fallbackText="Ảnh minh họa bài viết"
            className="mt-6 h-64 md:h-[360px]"
          />

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-black text-slate-900">Tóm tắt nhanh</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {insightSummary.highlights.map((item) => {
                return (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-700" />
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
            {insightSummary.mainActors.length > 0 ? (
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-bold text-slate-900">Ai/tổ chức liên quan:</span>{" "}
                {insightSummary.mainActors.join(", ")}
              </p>
            ) : null}
            {insightSummary.keyFigures.length > 0 ? (
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-bold text-slate-900">Số liệu chính:</span>{" "}
                {insightSummary.keyFigures.join(", ")}
              </p>
            ) : null}
            <p className="mt-2 text-sm font-semibold text-slate-800">{insightSummary.readDecision}</p>
          </section>

          <p className="mt-6 text-lg leading-8 text-slate-700">{article.summary}</p>

          {article.content ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-slate-700">
              <p className="leading-7">{article.content}</p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
            <BookmarkButton
              size="md"
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
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Đọc bài gốc
            </a>
          </div>

          {relatedByTopic.length > 0 ? (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black text-slate-900">Bài cùng chủ đề</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {relatedByTopic.map((item) => {
                  return (
                    <li key={item.id}>
                      <Link href={`/article/${item.slug}`} className="font-semibold hover:underline">
                        {item.title}
                      </Link>
                      <span className="ml-2 text-slate-500">
                        ({item.source.name} · {formatDateTime(item.publishedAt)})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
    </div>
  );
}
