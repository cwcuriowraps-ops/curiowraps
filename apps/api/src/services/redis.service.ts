import { Redis } from "ioredis";

interface CacheItem {
  value: any;
  expiresAt: number;
}

export class RedisService {
  private client: Redis | null = null;
  private memoryCache = new Map<string, CacheItem>();

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl.startsWith("rediss://")) {
      try {
        this.client = new Redis(redisUrl, {
          connectTimeout: 3000,
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });
        this.client.connect().catch((err) => {
          console.warn("[Redis] Connection failed, using fast in-memory cache fallback:", err.message);
          this.client = null;
        });
      } catch (err) {
        console.warn("[Redis] Initialization failed, using fast in-memory cache fallback:", err);
        this.client = null;
      }
    } else {
      console.info("[Redis] Disabled or unconfigured — using fast in-memory cache fallback.");
      this.client = null;
    }
  }

  public getClient(): Redis | null {
    return this.client;
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

    // 2. Try Redis
    if (this.client) {
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

    if (this.client) {
      try {
        await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
      } catch {
        // Fallback silently
      }
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.client) {
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

    if (this.client) {
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

