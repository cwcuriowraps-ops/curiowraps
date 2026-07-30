import { Router } from "express";

import type { ApiDependencies } from "../../context";
import { createSettingController } from "../../controllers/setting.controller";
import { asyncHandler } from "../../lib/async-handler";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

export function createAdminSettingRouter(deps: ApiDependencies) {
  const router = Router();
  const controller = createSettingController({
    settingRepository: deps.settingRepository,
    notificationService: deps.notificationService,
  });
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth, requirePermission("manage:settings"));

  router.get("/", asyncHandler(controller.getAll));
  router.patch("/", asyncHandler(controller.updateSettings));

  // Email Settings Routes
  router.get("/email", asyncHandler(controller.getEmailSettings));
  router.get("/email-settings", asyncHandler(controller.getEmailSettings));
  
  router.put("/email", asyncHandler(controller.updateEmailSettings));
  router.put("/email-settings", asyncHandler(controller.updateEmailSettings));

  router.post("/email/test", asyncHandler(controller.sendTestEmail));
  router.post("/email-settings/test", asyncHandler(controller.sendTestEmail));

  return router;
}
