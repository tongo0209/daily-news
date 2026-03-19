import { Category, RunStatus } from "@prisma/client";

export type RawFeedItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: {
    url?: string;
  };
  "media:content"?:
    | {
        $?: {
          url?: string;
        };
      }
    | {
        $?: {
          url?: string;
        };
      }[];
};

export type NormalizedFeedItem = {
  title: string;
  slug: string;
  summary: string;
  content: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: Date;
  category: Category;
};

export type IngestionSummary = {
  runId: string;
  status: RunStatus;
  totalFetched: number;
  insertedCount: number;
  skippedCount: number;
  errors: string[];
};
