import { Router } from "express";

import { createProductController } from "../../controllers/product.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createProductSchema, updateProductSchema } from "../../schemas/product.schema";

export function createAdminProductRouter(deps: any) {
  const router = Router();
  const controller = createProductController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", requirePermission("manage:products"), asyncHandler(controller.getAll));
  router.get("/:id", requirePermission("manage:products"), asyncHandler(controller.getById));
  
  router.post("/", requirePermission("manage:products"), validateRequest({ body: createProductSchema }), asyncHandler(controller.create));
  router.patch("/:id", requirePermission("manage:products"), validateRequest({ body: updateProductSchema }), asyncHandler(controller.update));
  
  router.delete("/:id", requirePermission("manage:products"), asyncHandler(controller.delete));
  router.post("/:id/restore", requirePermission("manage:products"), asyncHandler(controller.restore));

  return router;
}
