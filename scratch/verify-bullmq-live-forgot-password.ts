import { Queue } from "bullmq";
import { Redis } from "ioredis";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";
const RECIPIENT = "cw.curiowraps@gmail.com";

async function main() {
  console.log("\n=======================================================================");
  console.log("  LIVE BULLMQ FORGOT PASSWORD DISPATCH TRACE");
  console.log("=======================================================================\n");

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;

  const redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const emailQueue = new Queue("emailQueue", { connection: redisConnection as any });

  const initialCounts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
  console.log("1. Initial BullMQ Redis Counts:", initialCounts);

  // Trigger POST /forgot-password
  console.log(`\n2. Triggering POST ${API_BASE}/auth/forgot-password for <${RECIPIENT}>...`);
  const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email: RECIPIENT });
  console.log(`   API Response: HTTP ${res.status} ("${res.data?.data?.message || res.data?.message}")`);

  // Poll BullMQ job status for newly added job
  console.log("\n3. Polling BullMQ Redis for Job State Progression:");
  for (let i = 1; i <= 6; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const counts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    console.log(`   t+${i}s Queue Job Counts:`, counts);
  }

  const latestCompleted = await emailQueue.getCompleted(0, 1);
  if (latestCompleted.length > 0) {
    const job = latestCompleted[0];
    console.log(`\n✅ LATEST COMPLETED BULLMQ JOB TRACE:`);
    console.log(`   - Job ID: ${job.id}`);
    console.log(`   - Queue Name: emailQueue`);
    console.log(`   - Job Name: ${job.name}`);
    console.log(`   - Payload:`, JSON.stringify(job.data, null, 2));
    console.log(`   - State: [COMPLETED]`);
  }

  await emailQueue.close();
  await redisConnection.quit();

  console.log("\n=======================================================================\n");
}

main().catch(console.error);
