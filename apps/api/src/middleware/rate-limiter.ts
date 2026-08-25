import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import { type RedisService, isQuotaError } from "../services/redis.service";

export function createRateLimiter(_redisService: RedisService) {
  const isDev = process.env.NODE_ENV === "development";
  const maxRequests = isDev ? 10000 : 300;

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxRequests, // Limit each IP per 15 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
}

export function createAuthRateLimiter(redisService: RedisService) {
  const isDev = process.env.NODE_ENV === "development";
  const isTest = process.env.NODE_ENV === "test";
  const maxRequests = isDev || isTest ? 1000 : 5;
  const client = redisService.getClient();

  if (isTest || isDev || !client || redisService.isQuotaExceeded()) {
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
        if (redisService.isQuotaExceeded()) {
          throw new Error("Redis quota exceeded");
        }
        try {
          return await (client.call as Function).apply(client, args);
        } catch (err: any) {
          if (isQuotaError(err)) {
            throw new Error("Redis quota exceeded");
          }
          throw err;
        }
      },
    }),
  });
}
