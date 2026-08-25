import "dotenv/config";

import { createServer } from "http";

import { connectPrisma } from "@dashboard/database";

import { createApp } from "./app";
import { createApiConfig } from "./config";
import { createLogger } from "./lib/logger";

const config = createApiConfig();
const logger = createLogger(config);
const app = createApp({ config, logger });
const server = createServer(app);

if (process.env.NODE_ENV !== "test") {
  server.listen(config.port, () => {
    logger.info({ port: config.port }, "API listening");
    // Warm the Prisma connection pool in the background after the server is up.
    // This prevents EADDRINUSE races on tsx watch restarts and keeps startup fast.
    // Even if this fails, Prisma's built-in lazy-connect handles the first real request.
    connectPrisma().catch((err) => {
      logger.warn({ err }, "[Prisma] Background pool warm-up failed — will connect on first request");
    });
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received. Closing HTTP server...");
    server.close(() => {
      logger.info("HTTP server closed. Exiting process.");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after 10s timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error({ err: reason }, "[Process] Unhandled Promise Rejection intercepted");
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error({ err: error.message, stack: error.stack }, "[Process] Uncaught Exception intercepted");
  });
}

export { app, server };
