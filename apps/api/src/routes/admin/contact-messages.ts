import { Router } from "express";

import type { ApiDependencies } from "../../context";
import { createContactController } from "../../controllers/contact.controller";
import { asyncHandler } from "../../lib/async-handler";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

export function createAdminContactRouter(deps: ApiDependencies) {
  const router = Router();
  const controller = createContactController({
    contactRepository: deps.contactRepository,
  });
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Require admin authentication for all contact inbox routes
  router.use(requireAuth, requirePermission("manage:settings"));

  router.get("/", asyncHandler(controller.listMessages));
  router.get("/unread-count", asyncHandler(controller.getUnreadCount));
  router.get("/:id", asyncHandler(controller.getMessage));
  router.patch("/:id/status", asyncHandler(controller.updateStatus));
  router.delete("/:id", asyncHandler(controller.deleteMessage));

  return router;
}
