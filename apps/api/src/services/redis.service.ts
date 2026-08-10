import { Redis } from "ioredis";

/** Maximum reconnect delay cap: 30 seconds. */
const REDIS_MAX_RECONNECT_DELAY_MS = 30_000;
/** Starting reconnect delay: 1 second. */
const REDIS_INITIAL_RECONNECT_DELAY_MS = 1_000;
/** Maximum reconnect attempts before giving up permanently. */
const REDIS_MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Returns true if the Redis error message indicates Upstash (or similar
 * managed Redis) has rejected the command due to a rate/quota limit.
 */
export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message ?? "";
  return (
    msg.includes("max requests limit exceeded") ||
    msg.includes("ERR max") ||
    msg.includes("QUOTA_EXCEEDED") ||
    msg.includes("max_requests_limit")
  );
}

interface CacheItem {
  value: any;
  expiresAt: number;
}

export class RedisService {
  private client: Redis | null = null;
  private memoryCache = new Map<string, CacheItem>();
  private _quotaExhausted = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl.startsWith("rediss://")) {
      try {
        this.client = new Redis(redisUrl, {
          connectTimeout: 5_000,
          // BullMQ owns its own connections; this client is for cache + rate-limit only.
          maxRetriesPerRequest: 3,
          lazyConnect: true,

          /**
           * Exponential backoff: 1s, 2s, 4s … capped at 30 s.
           * After REDIS_MAX_RECONNECT_ATTEMPTS returns null → ioredis gives up.
           */
          retryStrategy(attempt: number) {
            if (attempt >= REDIS_MAX_RECONNECT_ATTEMPTS) {
              // Stop reconnecting. ioredis will emit 'end'.
              return null;
            }
            return Math.min(
              REDIS_INITIAL_RECONNECT_DELAY_MS * 2 ** attempt,
              REDIS_MAX_RECONNECT_DELAY_MS,
            );
          },

          /**
           * Do not reconnect at all if Redis explicitly rejected the command
           * (quota exceeded).  This prevents ioredis from thrashing the
           * connection after a quota rejection.
           */
          reconnectOnError(err: Error) {
            // reconnectOnError: return false → do not reconnect.
            if (isQuotaError(err)) return false;
            // true → reconnect on other errors (ECONNRESET, ETIMEDOUT, etc.)
            return true;
          },
        });

        // Log quota / generic errors once; do not spam.
        this.client.on("error", (err: Error) => {
          if (isQuotaError(err)) {
            if (!this._quotaExhausted) {
              this._quotaExhausted = true;
              console.error(
                "[Redis] Upstash quota exceeded. Redis commands will be suppressed until quota resets.",
                err.message,
              );
            }
          } else {
            // Only log non-quota errors; ioredis auto-reconnects via retryStrategy.
            console.warn("[Redis] Connection error:", err.message);
          }
        });

        this.client.on("reconnecting", () => {
          console.info("[Redis] Reconnecting…");
        });

        this.client.on("ready", () => {
          if (this._quotaExhausted) {
            console.info("[Redis] Connection restored. Clearing quota-exhausted flag.");
            this._quotaExhausted = false;
          } else {
            console.info("[Redis] Connection ready.");
          }
        });

        this.client.connect().catch((err) => {
          console.warn("[Redis] Initial connect failed, using in-memory cache fallback:", err.message);
          this.client = null;
        });
      } catch (err) {
        console.warn("[Redis] Initialization failed, using in-memory cache fallback:", err);
        this.client = null;
      }
    } else {
      console.info("[Redis] Disabled or unconfigured — using in-memory cache fallback.");
      this.client = null;
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  /** True when Upstash has rejected commands with a quota/limit error. */
  public get quotaExhausted(): boolean {
    return this._quotaExhausted;
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Try Memory Cache
    const item = this.memoryCache.get(key);
    if (item) {
      if (Date.now() < item.expiresAt) {
        return item.value as T;
      }
      this.memoryCache.delete(key);
    }

    // 2. Try Redis (skip if quota is exhausted)
    if (this.client && !this._quotaExhausted) {
      try {
        const data = await this.client.get(key);
        if (data) {
          const parsed = JSON.parse(data) as T;
          this.memoryCache.set(key, { value: parsed, expiresAt: Date.now() + 60 * 1000 });
          return parsed;
        }
      } catch {
        // Fallback silently
      }
    }

    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });

    if (this.client && !this._quotaExhausted) {
      try {
        await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
      } catch {
        // Fallback silently
      }
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.client && !this._quotaExhausted) {
      try {
        await this.client.del(key);
      } catch {
        // Fallback silently
      }
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const prefix = pattern.replace("*", "");
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    if (this.client && !this._quotaExhausted) {
      try {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await this.client.del(...keys);
          }
        } while (cursor !== "0");
      } catch {
        // Fallback silently
      }
    }
  }
}
