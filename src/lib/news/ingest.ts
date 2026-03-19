import { RunStatus } from "@prisma/client";
import Parser from "rss-parser";
import { prisma } from "@/lib/db";
import { NEWS_SOURCES } from "./source-config";
import { normalizeFeedItem } from "./mapper";
import { buildTopicSignature } from "./topic-utils";
import type { IngestionSummary, RawFeedItem } from "./types";

const parser = new Parser<Record<string, never>, RawFeedItem>({
  timeout: 15_000,
  headers: {
    "user-agent": "DailyNewsHubBot/1.0 (+https://localhost)",
  },
});

export async function runIngestion(limitPerFeed = 20): Promise<IngestionSummary> {
  const safeLimit = Math.max(1, Math.min(limitPerFeed, 100));
  const run = await prisma.ingestionRun.create({
    data: {
      status: RunStatus.FAILED,
    },
  });

  let totalFetched = 0;
  let insertedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  async function refreshTopicConfirmation(signature: string) {
    if (!signature) {
      return;
    }

    const related = await prisma.article.findMany({
      where: { topicSignature: signature },
      select: {
        id: true,
        sourceId: true,
      },
    });

    if (related.length === 0) {
      return;
    }

    const sourceCount = new Set(related.map((item) => item.sourceId)).size;

    await prisma.article.updateMany({
      where: {
        id: {
          in: related.map((item) => item.id),
        },
      },
      data: {
        sourceConfirmCount: Math.max(1, sourceCount),
      },
    });
  }

  for (const source of NEWS_SOURCES) {
    const sourceRecord = await prisma.source.upsert({
      where: { feedUrl: source.feedUrl },
      create: {
        name: source.name,
        homeUrl: source.homeUrl,
        feedUrl: source.feedUrl,
      },
      update: {
        name: source.name,
        homeUrl: source.homeUrl,
      },
    });

    const sourceRun = await prisma.sourceRun.create({
      data: {
        ingestionRunId: run.id,
        sourceId: sourceRecord.id,
        status: RunStatus.FAILED,
      },
    });

    let sourceFetched = 0;
    let sourceInserted = 0;
    let sourceSkipped = 0;
    const sourceErrors: string[] = [];

    try {
      const feed = await parser.parseURL(source.feedUrl);
      const items = feed.items.slice(0, safeLimit);
      sourceFetched = items.length;
      totalFetched += items.length;

      for (const item of items) {
        const normalized = normalizeFeedItem(item, source.category);

        if (!normalized) {
          sourceSkipped += 1;
          skippedCount += 1;
          continue;
        }

        try {
          const existing = await prisma.article.findUnique({
            where: { url: normalized.url },
            select: { id: true },
          });

          if (existing) {
            sourceSkipped += 1;
            skippedCount += 1;
            continue;
          }

          const topicSignature = buildTopicSignature(normalized.title) || null;

          await prisma.article.create({
            data: {
              title: normalized.title,
              slug: normalized.slug,
              summary: normalized.summary,
              content: normalized.content,
              url: normalized.url,
              imageUrl: normalized.imageUrl,
              publishedAt: normalized.publishedAt,
              category: normalized.category,
              topicSignature,
              sourceId: sourceRecord.id,
            },
          });

          if (topicSignature) {
            await refreshTopicConfirmation(topicSignature);
          }

          sourceInserted += 1;
          insertedCount += 1;
        } catch (error) {
          sourceSkipped += 1;
          skippedCount += 1;
          const message = `Insert error [${source.name}]: ${(error as Error).message}`;
          sourceErrors.push(message);
          errors.push(message);
        }
      }
    } catch (error) {
      const message = `Feed error [${source.name}]: ${(error as Error).message}`;
      sourceErrors.push(message);
      errors.push(message);
    }

    const sourceStatus: RunStatus =
      sourceErrors.length === 0
        ? RunStatus.SUCCESS
        : sourceInserted > 0
          ? RunStatus.PARTIAL
          : RunStatus.FAILED;

    await prisma.sourceRun.update({
      where: { id: sourceRun.id },
      data: {
        finishedAt: new Date(),
        status: sourceStatus,
        fetchedCount: sourceFetched,
        insertedCount: sourceInserted,
        skippedCount: sourceSkipped,
        errorMessage: sourceErrors.length > 0 ? sourceErrors.join("\n") : null,
      },
    });

    await prisma.source.update({
      where: { id: sourceRecord.id },
      data: {
        fetchCount: { increment: 1 },
        successCount: sourceStatus !== RunStatus.FAILED ? { increment: 1 } : undefined,
        errorCount:
          sourceStatus === RunStatus.FAILED || sourceErrors.length > 0
            ? { increment: 1 }
            : undefined,
        lastFetchedAt: new Date(),
        lastSuccessAt: sourceStatus === RunStatus.SUCCESS ? new Date() : undefined,
        lastErrorAt: sourceStatus === RunStatus.FAILED || sourceErrors.length > 0 ? new Date() : undefined,
      },
    });
  }

  const status: RunStatus =
    errors.length === 0
      ? RunStatus.SUCCESS
      : insertedCount > 0
        ? RunStatus.PARTIAL
        : RunStatus.FAILED;

  await prisma.ingestionRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      status,
      totalFetched,
      insertedCount,
      skippedCount,
      errors: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  return {
    runId: run.id,
    status,
    totalFetched,
    insertedCount,
    skippedCount,
    errors,
  };
}
