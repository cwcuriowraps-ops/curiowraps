import { Router } from "express";
import { z } from "zod";

import type { AdminUserControllerDeps } from "../../controllers/admin-user.controller";
import { createAdminUserController } from "../../controllers/admin-user.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { PERMISSIONS } from "../../types/rbac";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED", "INVITED"]),
});

const assignRoleSchema = z.object({
  role: z.string().min(1),
});

export function createAdminUserRouter(deps: AdminUserControllerDeps & { authService: any, config: any }) {
  const router = Router();
  const controller = createAdminUserController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Apply authentication explicitly along with permission boundary to manage users
  router.use(requireAuth, requirePermission(PERMISSIONS.USERS_MANAGE));

  router.get("/me", asyncHandler(controller.getMe));
  router.patch("/me", asyncHandler(controller.updateMe));

  router.get("/", asyncHandler(controller.listUsers));
  router.get("/:id", asyncHandler(controller.getUser));
  router.patch("/:id/status", validateRequest({ body: updateStatusSchema }), asyncHandler(controller.updateStatus));
  router.patch("/:id/role", validateRequest({ body: assignRoleSchema }), asyncHandler(controller.assignRole));
  router.delete("/:id", asyncHandler(controller.deleteUser));

  return router;
}
