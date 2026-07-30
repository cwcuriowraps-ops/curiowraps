import { Router } from "express";

import { createVariantController } from "../../controllers/variant.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createVariantSchema, updateVariantSchema } from "../../schemas/variant.schema";

export function createAdminVariantRouter(deps: any) {
  const router = Router();
  const controller = createVariantController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", requirePermission("manage:products"), asyncHandler(controller.getAll));
  router.get("/:id", requirePermission("manage:products"), asyncHandler(controller.getById));
  
  router.post("/", requirePermission("manage:products"), validateRequest({ body: createVariantSchema }), asyncHandler(controller.create));
  router.patch("/:id", requirePermission("manage:products"), validateRequest({ body: updateVariantSchema }), asyncHandler(controller.update));
  
  router.delete("/:id", requirePermission("manage:products"), asyncHandler(controller.delete));
  router.post("/:id/restore", requirePermission("manage:products"), asyncHandler(controller.restore));

  return router;
}
