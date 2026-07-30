import { Router } from "express";

import { createBrandController } from "../../controllers/brand.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createBrandSchema, updateBrandSchema } from "../../schemas/brand.schema";

export function createAdminBrandRouter(deps: any) {
  const router = Router();
  const controller = createBrandController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Apply authentication to all admin brand routes
  router.use(requireAuth);

  router.get(
    "/",
    requirePermission("manage:brands"),
    asyncHandler(controller.getAll)
  );

  router.get(
    "/:id",
    requirePermission("manage:brands"),
    asyncHandler(controller.getById)
  );

  router.post(
    "/",
    requirePermission("manage:brands"),
    validateRequest({ body: createBrandSchema }),
    asyncHandler(controller.create)
  );

  router.patch(
    "/:id",
    requirePermission("manage:brands"),
    validateRequest({ body: updateBrandSchema }),
    asyncHandler(controller.update)
  );

  router.delete(
    "/:id",
    requirePermission("manage:brands"),
    asyncHandler(controller.delete)
  );

  router.post(
    "/:id/restore",
    requirePermission("manage:brands"),
    asyncHandler(controller.restore)
  );

  return router;
}
