import { appConfig } from "@dashboard/config";
import type { HealthCheck } from "@dashboard/types";
import { Router } from "express";
import { z } from "zod";

import type { ApiDependencies } from "../context";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { AppError } from "../middleware/error-handler";

const healthQuerySchema = z
  .object({
    includeDatabase: z.enum(["true", "false"]).optional(),
  })
  .transform((query) => ({
    includeDatabase: query.includeDatabase === "true",
  }));

type HealthQuery = z.output<typeof healthQuerySchema>;

async function checkDatabase(prisma: ApiDependencies["prisma"]) {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return { status: "ok" as const };
  } catch {
    return { status: "error" as const };
  }
}

async function checkRedis(redisService: ApiDependencies["redisService"]) {
  try {
    if (redisService.quotaExhausted) {
      return { status: "error" as const };
    }
    const client = redisService.getClient();
    if (!client) return { status: "disabled" as const };
    
    // In-memory status check: ioredis sets client.status to "ready" when connected.
    // This avoids executing a network PING command on every health probe.
    return client.status === "ready" || client.status === "connect"
      ? { status: "ok" as const }
      : { status: "error" as const };
  } catch {
    return { status: "error" as const };
  }
}

function createHealthPayload(includeDatabase: boolean, databaseStatus?: "ok" | "error", redisStatus?: "ok" | "error" | "disabled") {
  const services: Record<string, string> = {};
  if (includeDatabase) {
    services.database = databaseStatus ?? "error";
  }
  if (redisStatus) {
    services.redis = redisStatus;
  }

  return {
    status: databaseStatus === "error" ? ("degraded" as const) : ("ok" as const),
    version: appConfig.apiVersion,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: Object.keys(services).length > 0 ? services as any : undefined,
  } satisfies HealthCheck;
}

export function createSystemRouter(deps: ApiDependencies) {
  const router = Router();

  router.get(
    "/health",
    validateRequest({ query: healthQuerySchema }),
    asyncHandler(async (_req, res) => {
      const validated = (res.locals as { validated?: { query?: HealthQuery } }).validated;
      const { includeDatabase } = validated?.query ?? { includeDatabase: false };

      const databaseStatus = includeDatabase
        ? (await checkDatabase(deps.prisma)).status
        : undefined;

      const redisStatus = includeDatabase
        ? (await checkRedis(deps.redisService)).status
        : undefined;

      const health = createHealthPayload(includeDatabase, databaseStatus, redisStatus);

      res.json({ success: true, data: health });
    }),
  );

  router.get(
    "/live",
    asyncHandler(async (_req, res) => {
      const health = createHealthPayload(false);

      res.json({ success: true, data: health });
    }),
  );

  router.get(
    "/ready",
    asyncHandler(async (_req, res) => {
      const databaseStatus = await checkDatabase(deps.prisma);
      const redisStatus = await checkRedis(deps.redisService);

      if (databaseStatus.status !== "ok") {
        throw new AppError(503, "SERVICE_UNAVAILABLE", "Database is not ready");
      }

      const health = createHealthPayload(true, databaseStatus.status, redisStatus.status);

      res.json({ success: true, data: health });
    }),
  );

  return router;
}
