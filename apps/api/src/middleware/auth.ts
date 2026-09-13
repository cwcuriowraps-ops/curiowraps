import type { NextFunction, Request, Response } from "express";

import type { ApiConfig } from "../config";
import type { AuthService } from "../services/auth.service";

import { AppError } from "./error-handler";

export interface AuthMiddlewareDeps {
  authService: AuthService;
  config: ApiConfig;
}

function extractBearerToken(req: Request) {
  const header = req.header("authorization");

  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  if (typeof req.query.token === "string" && req.query.token.trim()) {
    return req.query.token.trim();
  }

  return undefined;
}

export function createOptionalAuth(deps: AuthMiddlewareDeps) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);

    if (!token) {
      next();
      return;
    }

    try {
      req.authUser = await deps.authService.getCurrentUser(token);
      next();
    } catch {
      // Optional auth: ignore invalid/expired token and proceed unauthenticated
      next();
    }
  };
}

export function createRequireAuth(deps: AuthMiddlewareDeps) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);

    if (!token) {
      next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
      return;
    }

    try {
      req.authUser = await deps.authService.getCurrentUser(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}
