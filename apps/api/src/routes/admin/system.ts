import { Router } from "express";

import type { ApiDependencies } from "../../context";
import { createAdminSystemController } from "../../controllers/admin-system.controller";
import { asyncHandler } from "../../lib/async-handler";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

export function createAdminSystemRouter(deps: ApiDependencies) {
  const router = Router();
  const controller = createAdminSystemController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth, requirePermission("manage:settings"));

  router.get("/status", asyncHandler(controller.getStatus));
  router.get("/dashboard", asyncHandler(controller.dashboardStats));
  router.get("/export", asyncHandler(controller.exportData));
  router.get("/events", asyncHandler(controller.events));

  return router;
}
