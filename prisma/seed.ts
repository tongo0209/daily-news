import { PrismaClient } from "@prisma/client";
import { NEWS_SOURCES } from "../src/lib/news/source-config";

const prisma = new PrismaClient();

async function main() {
  const feedUrls = NEWS_SOURCES.map((source) => source.feedUrl);

  // Keep data aligned with current source configuration.
  await prisma.source.deleteMany({
    where: {
      feedUrl: {
        notIn: feedUrls,
      },
    },
  });

  for (const source of NEWS_SOURCES) {
    await prisma.source.upsert({
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
  }

  console.log(`Seeded ${NEWS_SOURCES.length} news sources.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
