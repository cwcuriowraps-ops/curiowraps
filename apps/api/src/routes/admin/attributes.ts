import { Router } from "express";

import { createAttributeController } from "../../controllers/attribute.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createAttributeSchema, updateAttributeSchema, createAttributeValueSchema } from "../../schemas/attribute.schema";

export function createAdminAttributeRouter(deps: any) {
  const router = Router();
  const controller = createAttributeController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", requirePermission("manage:products"), asyncHandler(controller.getAll));
  router.get("/:id", requirePermission("manage:products"), asyncHandler(controller.getById));
  
  router.post("/", requirePermission("manage:products"), validateRequest({ body: createAttributeSchema }), asyncHandler(controller.create));
  router.patch("/:id", requirePermission("manage:products"), validateRequest({ body: updateAttributeSchema }), asyncHandler(controller.update));
  router.delete("/:id", requirePermission("manage:products"), asyncHandler(controller.delete));
  
  router.post("/:id/values", requirePermission("manage:products"), validateRequest({ body: createAttributeValueSchema }), asyncHandler(controller.addValue));
  router.delete("/:id/values/:valueId", requirePermission("manage:products"), asyncHandler(controller.removeValue));

  return router;
}
