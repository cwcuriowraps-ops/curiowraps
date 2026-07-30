import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";
import type { Logger } from "pino";

export function createRequestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const requestId = req.header("x-request-id") ?? randomUUID();
    const startedAt = Date.now();

    res.setHeader("x-request-id", requestId);

    logger.info(
      {
        event: "request.started",
        requestId,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
      "request started",
    );

    res.on("finish", () => {
      logger.info(
        {
          event: "request.finished",
          requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        },
        "request completed",
      );
    });

    next();
  };
}