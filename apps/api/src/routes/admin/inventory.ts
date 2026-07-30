import { Router } from "express";

import { createInventoryController } from "../../controllers/inventory.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { adjustInventorySchema } from "../../schemas/inventory.schema";

export function createAdminInventoryRouter(deps: any) {
  const router = Router();
  const controller = createInventoryController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/stats", requirePermission("manage:products"), asyncHandler(controller.getInventoryStats));
  router.get("/", requirePermission("manage:products"), asyncHandler(controller.getInventory));
  router.get("/locations", requirePermission("manage:products"), asyncHandler(controller.getLocations));
  router.post("/adjust", requirePermission("manage:products"), validateRequest({ body: adjustInventorySchema }), asyncHandler(controller.adjustInventory));
  router.get("/movements", requirePermission("manage:products"), asyncHandler(controller.getMovements));

  return router;
}
