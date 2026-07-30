import type { NextFunction, Request, Response } from "express";

import { AppError } from "./error-handler";

export function requireRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      return next(new AppError(403, "FORBIDDEN", "Insufficient role access"));
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (req.authUser.role === "ADMIN" || req.authUser.role === "SUPER_ADMIN") {
      return next();
    }

    if (!req.authUser.permissions.includes(permission)) {
      return next(new AppError(403, "FORBIDDEN", `Missing required permission: ${permission}`));
    }

    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (req.authUser.role === "ADMIN" || req.authUser.role === "SUPER_ADMIN") {
      return next();
    }

    const hasAny = permissions.some((p) => req.authUser!.permissions.includes(p));
    if (!hasAny) {
      return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    }

    next();
  };
}

export function requireAllPermissions(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }

    if (req.authUser.role === "ADMIN" || req.authUser.role === "SUPER_ADMIN") {
      return next();
    }

    const hasAll = permissions.every((p) => req.authUser!.permissions.includes(p));
    if (!hasAll) {
      return next(new AppError(403, "FORBIDDEN", "Missing required permissions"));
    }

    next();
  };
}
