import { subDays, subHours } from "date-fns";
import { Category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CATEGORY_ORDER } from "@/lib/categories";
import { buildTopicSignature, scoreTopicSimilarity } from "./topic-utils";

export const PAGE_SIZE = 12;

export type TimeWindow = "all" | "24h" | "7d" | "30d";

export type FeedFilters = {
  sourceId?: string;
  window?: TimeWindow;
  categories?: Category[];
};

export type SourceOption = {
  id: string;
  name: string;
};

export type TopicGroup = {
  signature: string;
  title: string;
  articles: ArticleWithSource[];
};

export type EventCluster = {
  signature: string;
  title: string;
  sourceCount: number;
  articleCount: number;
  latestPublishedAt: Date;
  representative: ArticleWithSource;
  articles: ArticleWithSource[];
};

export type VerificationBadge = {
  level: "high" | "medium" | "low";
  label: string;
  sourceCount: number;
};

type PersonalizationSignals = {
  preferredCategories: Set<Category>;
  preferredSourceIds: Set<string>;
  categoryAffinity: Map<Category, number>;
  sourceAffinity: Map<string, number>;
};

export function getVerificationBadge(sourceCount: number): VerificationBadge {
  if (sourceCount >= 3) {
    return {
      level: "high",
      label: "Nhiều nguồn xác nhận",
      sourceCount,
    };
  }

  if (sourceCount === 2) {
    return {
      level: "medium",
      label: "Đã có từ 2 nguồn",
      sourceCount,
    };
  }

  return {
    level: "low",
    label: "Một nguồn, cần đối chiếu",
    sourceCount: 1,
  };
}

export type ArticleWithSource = Prisma.ArticleGetPayload<{
  include: {
    source: true;
  };
}>;

export function normalizeWindow(value?: string): TimeWindow {
  if (value === "24h" || value === "7d" || value === "30d") {
    return value;
  }

  return "all";
}

function hasWhere(where: Prisma.ArticleWhereInput): boolean {
  return Object.keys(where).length > 0;
}

function getWindowDate(window: TimeWindow): Date | null {
  if (window === "24h") {
    return subHours(new Date(), 24);
  }

  if (window === "7d") {
    return subDays(new Date(), 7);
  }

  if (window === "30d") {
    return subDays(new Date(), 30);
  }

  return null;
}

function buildBaseWhere(filters?: FeedFilters): Prisma.ArticleWhereInput {
  if (!filters) {
    return {};
  }

  const conditions: Prisma.ArticleWhereInput[] = [];

  if (filters.sourceId?.trim()) {
    conditions.push({ sourceId: filters.sourceId.trim() });
  }

  const publishedAfter = getWindowDate(filters.window ?? "all");

  if (publishedAfter) {
    conditions.push({
      publishedAt: {
        gte: publishedAfter,
      },
    });
  }

  if (filters.categories && filters.categories.length > 0) {
    conditions.push({
      category: {
        in: filters.categories,
      },
    });
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    AND: conditions,
  };
}

function combineWhere(
  base: Prisma.ArticleWhereInput,
  extra: Prisma.ArticleWhereInput,
): Prisma.ArticleWhereInput {
  if (!hasWhere(base)) {
    return extra;
  }

  if (!hasWhere(extra)) {
    return base;
  }

  return {
    AND: [base, extra],
  };
}

const VALID_CATEGORY_SET = new Set(Object.values(Category));
const DAY_MS = 24 * 60 * 60 * 1000;

function safeParseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseCategories(raw: string): Category[] {
  return safeParseStringArray(raw).filter((item): item is Category =>
    VALID_CATEGORY_SET.has(item as Category),
  );
}

function normalizeSignature(title: string, fallbackId: string): string {
  const signature = buildTopicSignature(title);

  if (signature && signature.length >= 8) {
    return signature;
  }

  return `single-${fallbackId}`;
}

function buildAffinityMap<T extends string>(items: T[]): Map<T, number> {
  const map = new Map<T, number>();

  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }

  return map;
}

function rankArticles(articles: ArticleWithSource[], signals: PersonalizationSignals | null): ArticleWithSource[] {
  if (!signals) {
    return articles;
  }

  return [...articles].sort((a, b) => {
    const scoreA = scoreArticle(a, signals);
    const scoreB = scoreArticle(b, signals);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });
}

function scoreArticle(article: ArticleWithSource, signals: PersonalizationSignals): number {
  let score = article.publishedAt.getTime() / DAY_MS;

  if (signals.preferredCategories.has(article.category)) {
    score += 8;
  }

  if (signals.preferredSourceIds.has(article.sourceId)) {
    score += 6;
  }

  score += (signals.categoryAffinity.get(article.category) ?? 0) * 1.1;
  score += (signals.sourceAffinity.get(article.sourceId) ?? 0) * 0.8;

  return score;
}

export async function getPersonalizationSignals(userId?: string | null): Promise<PersonalizationSignals | null> {
  if (!userId) {
    return null;
  }

  const [preference, views, saved] = await Promise.all([
    prisma.userPreference.findUnique({
      where: { userId },
      select: {
        preferredCategories: true,
        preferredSourceIds: true,
      },
    }),
    prisma.articleView.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 120,
      include: {
        article: {
          select: {
            category: true,
            sourceId: true,
          },
        },
      },
    }),
    prisma.savedArticle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        article: {
          select: {
            category: true,
            sourceId: true,
          },
        },
      },
    }),
  ]);

  const preferredCategories = new Set(parseCategories(preference?.preferredCategories ?? "[]"));
  const preferredSourceIds = new Set(safeParseStringArray(preference?.preferredSourceIds ?? "[]"));

  const categorySignalItems: Category[] = [];
  const sourceSignalItems: string[] = [];

  for (const view of views) {
    categorySignalItems.push(view.article.category);
    sourceSignalItems.push(view.article.sourceId);
  }

  for (const item of saved) {
    categorySignalItems.push(item.article.category, item.article.category);
    sourceSignalItems.push(item.article.sourceId, item.article.sourceId);
  }

  if (
    preferredCategories.size === 0 &&
    preferredSourceIds.size === 0 &&
    categorySignalItems.length === 0 &&
    sourceSignalItems.length === 0
  ) {
    return null;
  }

  return {
    preferredCategories,
    preferredSourceIds,
    categoryAffinity: buildAffinityMap(categorySignalItems),
    sourceAffinity: buildAffinityMap(sourceSignalItems),
  };
}

function buildSearchWhere(keyword: string, filters?: FeedFilters): Prisma.ArticleWhereInput {
  const base = buildBaseWhere(filters);
  const trimmed = keyword.trim();

  if (!trimmed) {
    return base;
  }

  return combineWhere(base, {
    OR: [
      { title: { contains: trimmed } },
      { summary: { contains: trimmed } },
      { source: { is: { name: { contains: trimmed } } } },
    ],
  });
}

export async function getSourceOptions(): Promise<SourceOption[]> {
  return prisma.source.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getLatestArticles(
  limit = 10,
  filters?: FeedFilters,
  userId?: string | null,
): Promise<ArticleWithSource[]> {
  const [articles, signals] = await Promise.all([
    prisma.article.findMany({
      where: buildBaseWhere(filters),
      orderBy: { publishedAt: "desc" },
      take: Math.max(limit * 3, limit),
      include: { source: true },
    }),
    getPersonalizationSignals(userId),
  ]);

  return rankArticles(articles, signals).slice(0, limit);
}

async function getLatestRawArticles(limit = 10, filters?: FeedFilters): Promise<ArticleWithSource[]> {
  return prisma.article.findMany({
    where: buildBaseWhere(filters),
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: { source: true },
  });
}

export async function getArticleBySlug(slug: string): Promise<ArticleWithSource | null> {
  return prisma.article.findUnique({
    where: { slug },
    include: { source: true },
  });
}

export async function getArticlesBySlugs(slugs: string[]): Promise<ArticleWithSource[]> {
  const cleaned = Array.from(new Set(slugs.map((slug) => slug.trim()).filter(Boolean)));

  if (cleaned.length === 0) {
    return [];
  }

  const items = await prisma.article.findMany({
    where: {
      slug: {
        in: cleaned,
      },
    },
    include: {
      source: true,
    },
  });

  const orderMap = new Map(cleaned.map((slug, index) => [slug, index]));

  return items.sort((a, b) => {
    return (orderMap.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.slug) ?? Number.MAX_SAFE_INTEGER);
  });
}

export async function getHomeSections(filters?: FeedFilters, userId?: string | null) {
  const baseWhere = buildBaseWhere(filters);

  const [latest, signals] = await Promise.all([
    getLatestRawArticles(32, filters),
    getPersonalizationSignals(userId),
  ]);
  const rankedLatest = rankArticles(latest, signals);
  const headline = rankedLatest[0] ?? null;

  const sections = await Promise.all(
    CATEGORY_ORDER.map(async (category) => {
      const where = combineWhere(baseWhere, { category });

      const articles = await prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: 4,
        include: { source: true },
      });

      return {
        category,
        articles,
      };
    }),
  );

  return {
    headline,
    latest: rankedLatest,
    sections,
  };
}

export async function searchArticles(
  keyword: string,
  limit = 30,
  filters?: FeedFilters,
  userId?: string | null,
): Promise<ArticleWithSource[]> {
  const [articles, signals] = await Promise.all([
    prisma.article.findMany({
      where: buildSearchWhere(keyword, filters),
      orderBy: { publishedAt: "desc" },
      take: Math.max(limit * 3, limit),
      include: { source: true },
    }),
    getPersonalizationSignals(userId),
  ]);

  return rankArticles(articles, signals).slice(0, limit);
}

export async function getCategoryPageData(
  category: Category,
  page = 1,
  pageSize = PAGE_SIZE,
  filters?: FeedFilters,
) {
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
  const baseWhere = buildBaseWhere(filters);
  const where = combineWhere(baseWhere, { category });

  const [total, items] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      include: { source: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    total,
    totalPages,
    page: Math.min(safePage, totalPages),
    items,
  };
}

export async function getTrendingTopics(filters?: FeedFilters, limit = 4): Promise<TopicGroup[]> {
  const baseWhere = buildBaseWhere(filters);

  const latest = await prisma.article.findMany({
    where: hasWhere(baseWhere) ? baseWhere : undefined,
    orderBy: { publishedAt: "desc" },
    take: 120,
    include: { source: true },
  });

  const grouped = new Map<string, ArticleWithSource[]>();

  for (const article of latest) {
    const signature = normalizeSignature(article.title, article.id);

    const cluster = grouped.get(signature) ?? [];
    cluster.push(article);
    grouped.set(signature, cluster);
  }

  const topics = Array.from(grouped.entries())
    .filter(([, items]) => {
      const sources = new Set(items.map((item) => item.sourceId));
      return items.length >= 2 && sources.size >= 2;
    })
    .map(([signature, items]) => {
      const sorted = [...items].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

      return {
        signature,
        title: sorted[0].title,
        articles: sorted.slice(0, 4),
      };
    })
    .sort((a, b) => {
      const bySize = b.articles.length - a.articles.length;

      if (bySize !== 0) {
        return bySize;
      }

      return b.articles[0].publishedAt.getTime() - a.articles[0].publishedAt.getTime();
    })
    .slice(0, limit);

  return topics;
}

export async function getEventClusters(filters?: FeedFilters, limit = 6): Promise<EventCluster[]> {
  const baseWhere = buildBaseWhere(filters);

  const latest = await prisma.article.findMany({
    where: hasWhere(baseWhere) ? baseWhere : undefined,
    orderBy: {
      publishedAt: "desc",
    },
    take: 180,
    include: {
      source: true,
    },
  });

  const grouped = new Map<string, ArticleWithSource[]>();

  for (const article of latest) {
    const signature = article.topicSignature ?? normalizeSignature(article.title, article.id);
    const bucket = grouped.get(signature) ?? [];
    bucket.push(article);
    grouped.set(signature, bucket);
  }

  return Array.from(grouped.entries())
    .map(([signature, items]) => {
      const sorted = [...items].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
      const uniqueSourceCount = new Set(sorted.map((item) => item.sourceId)).size;

      return {
        signature,
        title: sorted[0].title,
        sourceCount: uniqueSourceCount,
        articleCount: sorted.length,
        latestPublishedAt: sorted[0].publishedAt,
        representative: sorted[0],
        articles: sorted.slice(0, 5),
      };
    })
    .filter((cluster) => cluster.articleCount >= 2 && cluster.sourceCount >= 2)
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) {
        return b.sourceCount - a.sourceCount;
      }

      if (b.articleCount !== a.articleCount) {
        return b.articleCount - a.articleCount;
      }

      return b.latestPublishedAt.getTime() - a.latestPublishedAt.getTime();
    })
    .slice(0, limit);
}

export async function getRelatedByTopic(
  article: ArticleWithSource,
  limit = 4,
): Promise<ArticleWithSource[]> {
  const candidates = await prisma.article.findMany({
    where: {
      category: article.category,
      id: {
        not: article.id,
      },
      publishedAt: {
        gte: subDays(new Date(), 14),
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 80,
    include: {
      source: true,
    },
  });

  return candidates
    .map((item) => {
      const score = scoreTopicSimilarity(article.title, item.title);

      return {
        item,
        score,
      };
    })
    .filter((entry) => entry.score >= 0.34)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.item.publishedAt.getTime() - a.item.publishedAt.getTime();
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}

export async function getDashboardData() {
  const [articleCount, sourceCount, recentRuns, categoryBreakdown, sourceHealth, recentSourceRuns] =
    await Promise.all([
      prisma.article.count(),
      prisma.source.count(),
      prisma.ingestionRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 8,
      }),
      prisma.article.groupBy({
        by: ["category"],
        _count: {
          _all: true,
        },
      }),
      prisma.source.findMany({
        orderBy: [{ errorCount: "desc" }, { name: "asc" }],
      }),
      prisma.sourceRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 12,
        include: {
          source: true,
        },
      }),
    ]);

  return {
    articleCount,
    sourceCount,
    recentRuns,
    categoryBreakdown,
    sourceHealth,
    recentSourceRuns,
  };
}

export async function recordArticleView(userId: string, articleId: string) {
  await prisma.articleView.create({
    data: {
      userId,
      articleId,
    },
  });
}
