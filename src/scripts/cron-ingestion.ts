import cron from "node-cron";
import { runIngestion } from "../lib/news/ingest";

const schedule = process.env.INGEST_CRON ?? "0 */2 * * *";
const timezone = process.env.TZ ?? "Asia/Ho_Chi_Minh";

if (!cron.validate(schedule)) {
  throw new Error(`Invalid INGEST_CRON value: ${schedule}`);
}

let isRunning = false;

async function runSafely() {
  if (isRunning) {
    console.log("Skip: previous ingestion is still running.");
    return;
  }

  isRunning = true;

  try {
    const result = await runIngestion();
    console.log("Cron ingestion result:", result);
  } catch (error) {
    console.error("Cron ingestion failed:", error);
  } finally {
    isRunning = false;
  }
}

console.log(`Scheduler started. Cron: ${schedule}, Timezone: ${timezone}`);
void runSafely();

cron.schedule(schedule, () => {
  void runSafely();
}, { timezone });
