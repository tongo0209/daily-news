import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { CATEGORY_ORDER, categoryToSlug } from "@/lib/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const now = new Date();

  const articles = await prisma.article.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 2000,
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteUrl}/tai-khoan`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/doc-sau`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/admin`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.3,
    },
    ...CATEGORY_ORDER.map((category) => ({
      url: `${siteUrl}/category/${categoryToSlug(category)}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/article/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
