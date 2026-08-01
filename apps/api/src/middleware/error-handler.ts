import type { ApiError } from "@dashboard/types";
import type { ErrorRequestHandler, Request, Response } from "express";
import type { Logger } from "pino";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  const error: ApiError = {
    code: "NOT_FOUND",
    message: "The requested resource was not found",
  };
  res.status(404).json({ success: false, error });
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err: Error, _req, res, _next) => {
    if (_req.method === "POST" && _req.originalUrl.includes("/admin/categories")) {
      console.error("[Category Create][API Error] Unhandled route exception", err);
      console.error("[Category Create][API Error] Stack", err.stack);
    }
    const requestId = res.getHeader("x-request-id");

    if (err instanceof AppError) {
      logger.warn(
        {
          event: "request.error",
          requestId,
          code: err.code,
          statusCode: err.statusCode,
          details: err.details,
        },
        err.message,
      );

      const error: ApiError = {
        code: err.code,
        message: err.message,
        details: err.details,
      };

      res.status(err.statusCode).json({ success: false, error });
      return;
    }

    if ((err as any).code === "P2002") {
      logger.warn(
        {
          event: "request.conflict",
          requestId,
          err,
        },
        "prisma unique constraint conflict",
      );

      const target = (err as any).meta?.target;
      const fieldName = Array.isArray(target) ? target.join(", ") : target || "slug";
      const error: ApiError = {
        code: "CONFLICT",
        message: `A record with this ${fieldName} already exists.`,
      };

      res.status(409).json({ success: false, error });
      return;
    }

    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      logger.warn(
        {
          event: "request.unauthorized",
          requestId,
          err,
        },
        "jwt error",
      );

      const error: ApiError = {
        code: "UNAUTHORIZED",
        message: err.message,
      };

      res.status(401).json({ success: false, error });
      return;
    }

    if (err instanceof ZodError) {
      const details: Record<string, string[]> = {};

      for (const issue of err.issues) {
        const path = issue.path.join(".");

        if (!details[path]) {
          details[path] = [];
        }

        details[path].push(issue.message);
      }

      logger.warn(
        {
          event: "request.validation_failed",
          requestId,
          details,
        },
        "request validation failed",
      );

      const error: ApiError = {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details,
      };

      res.status(400).json({ success: false, error });
      return;
    }

    logger.error(
      {
        event: "request.unhandled_error",
        requestId,
        err,
      },
      "unexpected error",
    );

    const error: ApiError = {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
    };

    res.status(500).json({ success: false, error });
  };
}
