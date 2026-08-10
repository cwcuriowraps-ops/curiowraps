import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import type { RedisService } from "../services/redis.service";

export function createRateLimiter(redisService: RedisService) {
  const client = redisService.getClient();
  const isDev = process.env.NODE_ENV === "development";
  const maxRequests = isDev ? 10000 : 300;

  if (!client) {
    console.warn(`Redis client not available, using memory store for rate limiting (max: ${maxRequests}).`);
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: maxRequests, // Limit each IP per 15 minutes
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        // Use apply to avoid TS2556 spread-into-overloaded-call error
        return (client.call as Function).apply(client, args);
      },
    }),
  });
}

export function createAuthRateLimiter(redisService: RedisService) {
  const client = redisService.getClient();
  const isDev = process.env.NODE_ENV === "development";
  const maxRequests = isDev ? 1000 : 5;

  if (!client) {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        // Use apply to avoid TS2556 spread-into-overloaded-call error
        return (client.call as Function).apply(client, args);
      },
    }),
  });
}
