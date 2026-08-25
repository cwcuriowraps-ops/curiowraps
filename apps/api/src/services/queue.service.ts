import { Queue, Worker, type Job } from "bullmq";
import type { RedisOptions } from "ioredis";

import type { NotificationService } from "./notification.service";
import type { RedisService } from "./redis.service";
import { isQuotaError } from "./redis.service";

// ─── Constants ─────────────────────────────────────────────────────────────

/**
 * How long the worker pauses before retrying after a quota / Redis error.
 * Starts at INITIAL, doubles on each consecutive failure, capped at MAX.
 */
const WORKER_ERROR_BACKOFF_INITIAL_MS = 10_000; // 10 s
const WORKER_ERROR_BACKOFF_MAX_MS = 5 * 60_000;  // 5 min

/**
 * drainDelay (seconds): how long BullMQ waits in BZPOPMIN when the queue is
 * empty before issuing the next BZPOPMIN. Upstash charges per command, so a
 * higher value reduces idle polling commands at the cost of slightly higher
 * latency on the first job of a new burst.
 *
 * Default BullMQ value:  5 s → ~17,280 BZPOPMIN/day (idle).
 * Our value:           120 s →    720 BZPOPMIN/day (idle). −95.8 % reduction.
 */
const WORKER_DRAIN_DELAY_S = 120;

/**
 * stalledInterval (ms): how often BullMQ scans for stalled active jobs.
 * Default:   30,000 ms → 2,880 scans/day.
 * Our value: 300,000 ms →   288 scans/day. −90 % stall-check commands.
 */
const WORKER_STALLED_INTERVAL_MS = 300_000;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Parse a Redis(s) URL into a BullMQ-compatible RedisOptions object.
 *
 * BullMQ's RedisConnection does NOT accept a raw URL string; it needs an
 * options object with host, port, password, etc.
 */
function parseRedisUrl(url: string): RedisOptions {
  const parsed = new URL(url);
  const isTls = parsed.protocol === "rediss:";
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || "default",
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    tls: isTls ? {} : undefined,
    // BullMQ manages its own reconnect via its internal retryStrategy.
    // Set a sensible cap so transient errors don't spin infinitely.
    retryStrategy(attempt: number) {
      if (attempt >= 10) return null; // give up after 10 attempts
      return Math.min(1_000 * 2 ** attempt, 30_000);
    },
  };
}

// ─── QueueService ──────────────────────────────────────────────────────────

export class QueueService {
  private emailQueue: Queue | null = null;
  private emailWorker: Worker | null = null;

  /** How many consecutive infrastructure errors the worker has hit. */
  private _workerErrorCount = 0;
  /** Timer handle for the scheduled worker resume after a back-off pause. */
  private _workerResumeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {
    this._init();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private _init() {
    const client = this.redisService.getClient();
    if (!client) {
      console.warn("[BullMQ][Init] Redis client not available. Email jobs will process synchronously.");
      return;
    }

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn("[BullMQ][Init] REDIS_URL not set. Email jobs will process synchronously.");
      return;
    }

    console.info("[BullMQ][Init] Initializing BullMQ emailQueue…");

    // Parse the Redis URL into a plain options object for BullMQ.
    // BullMQ creates its own independent connections (including a dedicated
    // blocking connection for BZPOPMIN) — it must NOT share the cache client.
    const bullConnection: RedisOptions = parseRedisUrl(redisUrl);

    // Default job options applied to every job added to this queue.
    const defaultJobOptions = {
      attempts: 3,
      backoff: { type: "exponential" as const, delay: 2_000 },
      removeOnComplete: {
        // Keep up to 100 completed job records, expire after 1 hour.
        count: 100,
        age: 3_600, // seconds
      },
      removeOnFail: {
        // Keep up to 500 failed job records for debugging, expire after 24 h.
        count: 500,
        age: 86_400, // seconds
      },
    };

    this.emailQueue = new Queue("emailQueue", {
      connection: bullConnection,
      defaultJobOptions,
    });

    this.emailQueue.on("error", (err: Error) => {
      if (isQuotaError(err)) {
        console.warn("[BullMQ][Queue] Upstash quota exceeded on emailQueue connection:", err.message);
      } else {
        console.warn("[BullMQ][Queue] Redis connection error on emailQueue:", err.message);
      }
    });

    const emailWorker = new Worker(
      "emailQueue",
      async (job: Job) => {
        console.info(`[BullMQ][Worker] Processing job ${job.id} (${job.name}) attempt #${job.attemptsMade + 1}`);
        await this.notificationService.processEmailJob(job.name, job.data);
      },
      {
        connection: bullConnection,
        concurrency: 2,
        drainDelay: WORKER_DRAIN_DELAY_S,
        stalledInterval: WORKER_STALLED_INTERVAL_MS,
      },
    );

    // ── Success path ────────────────────────────────────────────────────────
    emailWorker.on("completed", (job) => {
      this._workerErrorCount = 0; // reset backoff counter on success
      console.info(`[BullMQ][Worker] Job ${job.id} completed successfully.`);
    });

    // ── Job failure path (processor threw) ──────────────────────────────────
    emailWorker.on("failed", (job, err) => {
      console.error(
        `[BullMQ][Worker] Job ${job?.id} (${job?.name}) failed on attempt ${job?.attemptsMade}:`,
        err.message,
      );
    });

    // ── Infrastructure error path (connection-level / framework-level) ───────
    //
    // THIS IS THE CRITICAL FIX FOR THE TIGHT-RETRY LOOP.
    //
    // Root cause:
    //   When Upstash returns "ERR max requests limit exceeded", BullMQ's
    //   isNotConnectionError() classifies it as a *non-connection* error
    //   (because the message does not match ECONNREFUSED or
    //   CONNECTION_CLOSED_ERROR_MSG). As a result, retryIfFailed immediately
    //   re-throws it — no delay — causing mainLoop() to exit and run() to
    //   complete. ioredis then reconnects via its retryStrategy (fast),
    //   fires "ready", BullMQ's blockingConnection emits "ready", and resume()
    //   starts a new run() call — all within milliseconds.
    //
    //   Outcome: reconnect → ready → run() → BZPOPMIN → quota error →
    //            mainLoop exits → repeat. Hundreds of BZPOPMIN commands per
    //            second, exhausting the Upstash 500K monthly request limit.
    //
    // Fix:
    //   Listen to the worker "error" event. When a quota or connection error
    //   is detected, pause() the worker (stops BZPOPMIN from being issued)
    //   and schedule a resume() after an exponential back-off delay.  The
    //   back-off starts at 10 s and doubles on each consecutive error, capped
    //   at 5 minutes.  This means:
    //     - 1st error → 10 s pause
    //     - 2nd error → 20 s pause
    //     - 3rd error → 40 s pause
    //     - 4th error → 80 s pause
    //     - ...
    //     - 9th+ error → 300 s (5 min) pause
    //
    //   The error count resets to 0 on the first successful job completion.
    emailWorker.on("error", (err: Error) => {
      const isQuota = isQuotaError(err);
      const isConnErr =
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("ETIMEDOUT") ||
        err.message.includes("Connection is closed") ||
        err.message.includes("ECONNRESET") ||
        err.message.includes("ERR Connection to server lost");

      if (!isQuota && !isConnErr) {
        // Application-level / unknown error — log and let BullMQ handle it.
        console.error("[BullMQ][Worker] Non-infrastructure error:", err.message);
        return;
      }

      // Infrastructure error: pause the worker with exponential back-off.
      this._workerErrorCount += 1;
      const delay = Math.min(
        WORKER_ERROR_BACKOFF_INITIAL_MS * 2 ** (this._workerErrorCount - 1),
        WORKER_ERROR_BACKOFF_MAX_MS,
      );

      if (isQuota) {
        console.error(
          `[BullMQ][Worker] Upstash quota exceeded (consecutive error #${this._workerErrorCount}). ` +
          `Pausing worker for ${delay / 1_000}s to prevent BZPOPMIN tight-retry loop.`,
        );
      } else {
        console.warn(
          `[BullMQ][Worker] Redis connection error (consecutive error #${this._workerErrorCount}). ` +
          `Pausing worker for ${delay / 1_000}s before retry.`,
        );
      }

      // Pause the worker — this stops BZPOPMIN from being issued.
      emailWorker.pause().catch(() => { /* already paused or closed */ });

      // Cancel any pending resume so back-offs don't stack.
      if (this._workerResumeTimer !== null) {
        clearTimeout(this._workerResumeTimer);
        this._workerResumeTimer = null;
      }

      // Schedule a single resume attempt after the back-off period.
      this._workerResumeTimer = setTimeout(() => {
        this._workerResumeTimer = null;
        console.info(
          `[BullMQ][Worker] Back-off complete (${delay / 1_000}s). Attempting to resume worker.`,
        );
        emailWorker.resume();
      }, delay);
    });

    this.emailWorker = emailWorker;
    console.info("[BullMQ][Init] BullMQ emailQueue & Worker initialized (drainDelay=30s, stalledInterval=60s).");
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async sendEmail(type: string, data: any) {
    try {
      if (this.emailQueue) {
        const job = await this.emailQueue.add(type, data);
        console.info(`[QueueService] Job ${job.id} (${type}) queued for <${data.email}>.`);
      } else {
        // Redis unavailable: deliver synchronously so no email is lost.
        console.info(`[QueueService] No queue — delivering ${type} synchronously for <${data.email}>.`);
        await this.notificationService.processEmailJob(type, data);
        console.info(`[QueueService] Synchronous delivery succeeded for <${data.email}>.`);
      }
    } catch (error: any) {
      // Queue.add failed (e.g. quota exceeded at enqueue time).
      // Fall back to synchronous delivery so the email is not silently lost.
      console.warn(
        `[QueueService] Queue.add failed for ${type} (<${data.email}>): ${error?.message}. ` +
        `Falling back to synchronous delivery.`,
      );
      try {
        await this.notificationService.processEmailJob(type, data);
        console.info(`[QueueService] Synchronous fallback delivery succeeded for <${data.email}>.`);
      } catch (syncError: any) {
        console.error(
          `[QueueService] Synchronous fallback ALSO failed for ${type} (<${data.email}>):`,
          syncError?.message,
        );
        throw syncError;
      }
    }
  }

  async close() {
    if (this._workerResumeTimer !== null) {
      clearTimeout(this._workerResumeTimer);
      this._workerResumeTimer = null;
    }
    await Promise.all([
      this.emailWorker?.close(),
      this.emailQueue?.close(),
    ]);
  }
}
