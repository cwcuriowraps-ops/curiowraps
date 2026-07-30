import { Queue } from "bullmq";
import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;

  const redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const emailQueue = new Queue("emailQueue", { connection: redisConnection as any });

  const failedJobs = await emailQueue.getFailed(0, 20);
  console.log("\n=======================================================");
  console.log(`  INSPECTING ${failedJobs.length} PREVIOUSLY FAILED JOBS IN BULLMQ`);
  console.log("=======================================================\n");

  for (const job of failedJobs) {
    console.log(`Job ID: ${job.id} | Name: ${job.name} | Recipient: ${job.data?.email || "N/A"}`);
    console.log(`Failed Reason: ${job.failedReason}`);
    console.log(`Stacktrace:`, job.stacktrace?.[0] || "None");
    console.log("-------------------------------------------------------");
  }

  await emailQueue.close();
  await redisConnection.quit();
}

main().catch(console.error);
