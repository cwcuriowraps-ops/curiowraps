import { Router } from "express";

import { createCategoryController } from "../../controllers/category.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createCategorySchema, updateCategorySchema } from "../../schemas/category.schema";

export function createAdminCategoryRouter(deps: any) {
  const router = Router();
  const controller = createCategoryController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Apply authentication to all admin category routes
  router.use(requireAuth);

  router.get(
    "/",
    requirePermission("manage:categories"),
    asyncHandler(controller.getAll)
  );

  router.get(
    "/:id",
    requirePermission("manage:categories"),
    asyncHandler(controller.getById)
  );

  router.post(
    "/",
    requirePermission("manage:categories"),
    validateRequest({ body: createCategorySchema }),
    asyncHandler(controller.create)
  );

  router.patch(
    "/:id",
    requirePermission("manage:categories"),
    validateRequest({ body: updateCategorySchema }),
    asyncHandler(controller.update)
  );

  router.delete(
    "/:id",
    requirePermission("manage:categories"),
    asyncHandler(controller.delete)
  );

  router.post(
    "/:id/restore",
    requirePermission("manage:categories"),
    asyncHandler(controller.restore)
  );

  return router;
}
