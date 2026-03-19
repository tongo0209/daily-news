import { Category } from "@prisma/client";
import type { NormalizedFeedItem, RawFeedItem } from "./types";
import { buildArticleSlug } from "./slug";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function toDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function pickImageUrl(item: RawFeedItem): string | null {
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  const media = item["media:content"];

  if (Array.isArray(media)) {
    return media[0]?.$?.url ?? null;
  }

  return media?.$?.url ?? null;
}

export function normalizeFeedItem(
  item: RawFeedItem,
  category: Category,
): NormalizedFeedItem | null {
  const title = item.title?.trim() ?? "";
  const url = item.link?.trim() ?? "";

  if (!title || !url) {
    return null;
  }

  const rawText = item.contentSnippet || item.summary || item.content || "";
  const cleanText = stripHtml(rawText);
  const summary = truncate(cleanText || title, 220);
  const content = item.content ? truncate(stripHtml(item.content), 6000) : null;

  return {
    title,
    slug: buildArticleSlug(title, url),
    summary,
    content,
    url,
    imageUrl: pickImageUrl(item),
    publishedAt: toDate(item.isoDate) ?? toDate(item.pubDate) ?? new Date(),
    category,
  };
}
