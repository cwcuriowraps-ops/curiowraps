import { Queue, Worker, type Job } from "bullmq";

import type { NotificationService } from "./notification.service";
import type { RedisService } from "./redis.service";

export class QueueService {
  private emailQueue: Queue | null = null;
  private workers: Worker[] = [];

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService
  ) {
    const client = this.redisService.getClient();
    if (client) {
      console.info("[BullMQ][Init] Initializing BullMQ emailQueue...");
      this.emailQueue = new Queue("emailQueue", { connection: client as any });
      
      const emailWorker = new Worker(
        "emailQueue",
        async (job: Job) => {
          console.info(`[BullMQ][Worker:StartProcessing] Job ID: ${job.id} | Name: ${job.name}`, {
            data: job.data,
            attemptsMade: job.attemptsMade,
          });
          await this.notificationService.processEmailJob(job.name, job.data);
        },
        { connection: client as any }
      );
      
      emailWorker.on("completed", (job) => {
        console.info(`[BullMQ][Worker:Completed] Job ID: ${job.id} processed successfully.`);
      });
      
      emailWorker.on("failed", (job, err) => {
        console.error(`[BullMQ][Worker:Failed] Job ID: ${job?.id} failed with error: ${err.message}`, {
          stack: err?.stack,
        });
      });
      
      this.workers.push(emailWorker);
      console.info("[BullMQ][Init] BullMQ emailQueue & Worker initialized.");
    } else {
      console.warn("[BullMQ][Init] Redis client not available. Email jobs will process synchronously.");
    }
  }

  async sendEmail(type: string, data: any) {
    console.info(`[QueueService][sendEmail] Dispatching job type: ${type} for recipient: <${data.email}>`);
    try {
      if (this.emailQueue) {
        console.info(`[BullMQ][Queue:Add] Adding job ${type} to BullMQ queue...`);
        const job = await this.emailQueue.add(type, data, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        });
        console.info(`[BullMQ][Queue:AddedSuccess] Job ID: ${job.id} added to emailQueue for recipient: <${data.email}>`);
      } else {
        console.info(`[QueueService] Processing job ${type} synchronously for recipient: <${data.email}>`);
        await this.notificationService.processEmailJob(type, data);
        console.info(`[QueueService] Synchronous processing succeeded for recipient: <${data.email}>`);
      }
    } catch (error: any) {
      console.error(`[QueueService] Exception sending email job ${type}:`, {
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async close() {
    await Promise.all(this.workers.map(w => w.close()));
  }
}
