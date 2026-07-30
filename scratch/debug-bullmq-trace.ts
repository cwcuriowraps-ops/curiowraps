import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";
const RECIPIENT = "cw.curiowraps@gmail.com";

async function main() {
  console.log("\n=======================================================================");
  console.log("  BULLMQ DEEP DEBUG & JOB LIFECYCLE TRACE");
  console.log("=======================================================================\n");

  const redisUrl = process.env.REDIS_URL;
  console.log("1. REDIS CONNECTION VERIFICATION:");
  console.log(`   REDIS_URL: ${redisUrl ? `${redisUrl.substring(0, 18)}***` : "(none)"}`);

  if (!redisUrl) {
    console.error("❌ REDIS_URL is missing in environment variables!");
    return;
  }

  // Create isolated Redis connection for BullMQ
  const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 5000,
  });

  try {
    const pingRes = await redisConnection.ping();
    console.log(`   ✅ Redis Ping Result: ${pingRes} (Connected cleanly to Redis)`);
  } catch (pingErr: any) {
    console.error(`   ❌ Redis Ping Failed: ${pingErr?.message || pingErr}`);
    console.error(`   [Root Cause Analysis] BullMQ cannot connect to Redis host: ${pingErr?.message}`);
    return;
  }

  // 2. Initialize Queue & Worker
  console.log("\n2. INITIALIZING BULLMQ QUEUE & WORKER:");
  const emailQueue = new Queue("emailQueue", { connection: redisConnection as any });
  console.log("   ✅ Queue 'emailQueue' initialized.");

  // Check initial job counts
  const initialCounts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
  console.log("   Initial Job Counts in 'emailQueue':", initialCounts);

  let workerProcessed = false;
  let workerCompleted = false;
  let workerError: any = null;

  const emailWorker = new Worker(
    "emailQueue",
    async (job: Job) => {
      console.log(`\n   ⚡ [WORKER CONSUME START] Job ID: ${job.id} | Name: ${job.name}`);
      console.log("      Job Payload:", JSON.stringify(job.data, null, 2));
      workerProcessed = true;

      // Simulate NotificationService & Brevo execution step by step
      console.log("      [Step 4] processEmailJob() entered with payload:", job.data);
      console.log("      [Step 5] BrevoEmailProvider.sendEmail() entered for recipient:", job.data.email);

      const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
      const port = Number(process.env.BREVO_SMTP_PORT) || 587;
      const user = process.env.BREVO_SMTP_USER;
      const pass = process.env.BREVO_SMTP_PASS;
      const from = process.env.EMAIL_FROM || "cw.curiowraps@gmail.com";

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });

      console.log("      [Step 6] Invoking transporter.sendMail()...");
      const info = await transporter.sendMail({
        from,
        to: job.data.email,
        subject: "Forgot Password Reset Link (BullMQ Trace)",
        text: `Click link: ${job.data.resetLink}`,
      });

      console.log("      [Step 6 Output] Nodemailer Response:", {
        accepted: info.accepted,
        rejected: info.rejected,
        messageId: info.messageId,
        response: info.response,
      });
    },
    { connection: redisConnection as any }
  );

  emailWorker.on("completed", (job) => {
    console.log(`   ✅ [WORKER EVENT] Job ID: ${job.id} marked COMPLETED.`);
    workerCompleted = true;
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`   ❌ [WORKER EVENT] Job ID: ${job?.id} FAILED: ${err.message}`, err.stack);
    workerError = err;
  });

  console.log("   ✅ Worker created and listening on queue 'emailQueue'.");

  // 3. Add a test job to Queue
  console.log("\n3. TESTING QUEUE.ADD():");
  const testData = {
    email: RECIPIENT,
    firstName: "QA",
    resetLink: "http://localhost:3000/auth/reset-password?token=test_bullmq_trace_token",
  };

  const job = await emailQueue.add("FORGOT_PASSWORD", testData, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });

  console.log(`   ✅ Queue.add() Succeeded:`);
  console.log(`      Job ID: ${job.id}`);
  console.log(`      Queue Name: emailQueue`);
  console.log(`      Job Name: FORGOT_PASSWORD`);
  console.log(`      Payload:`, testData);

  // Poll job state progression
  console.log("\n4. MONITORING JOB STATE PROGRESSION IN REDIS:");
  let state = await job.getState();
  console.log(`   Current Job State immediately after Queue.add(): [${state.toUpperCase()}]`);

  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    state = await job.getState();
    const counts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    console.log(`   t+${i + 1}s -> Job State: [${state.toUpperCase()}] | Queue Counts:`, counts);

    if (state === "completed" || state === "failed") {
      break;
    }
  }

  // Final Summary Report
  console.log("\n=======================================================================");
  console.log("  FINAL TRACE SUMMARY REPORT:");
  console.log("=======================================================================");
  console.log(`  - Worker Received Job: ${workerProcessed}`);
  console.log(`  - Worker Completed Job: ${workerCompleted}`);
  console.log(`  - Final Job State in Redis: [${state.toUpperCase()}]`);

  if (workerError) {
    console.error(`  - Worker Error: ${workerError.message}`);
  }

  await emailWorker.close();
  await emailQueue.close();
  await redisConnection.quit();

  console.log("=======================================================================\n");
}

main().catch(console.error);
