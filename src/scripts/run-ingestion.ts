import { runIngestion } from "../lib/news/ingest";
import { prisma } from "../lib/db";

async function main() {
  const startedAt = Date.now();
  const result = await runIngestion();
  const finishedInSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log("Ingestion completed:", {
    ...result,
    durationSeconds: finishedInSeconds,
  });
}

main()
  .catch((error) => {
    console.error("Ingestion failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Done.");
  });
