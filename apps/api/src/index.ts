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
}

export { app, server };
