import { Router } from "express";

import { createCouponController } from "../../controllers/coupon.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createCouponSchema, updateCouponSchema } from "../../schemas/coupon.schema";

export function createAdminCouponRouter(deps: any) {
  const router = Router();
  const controller = createCouponController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", requirePermission("manage:orders"), asyncHandler(controller.getAll));
  router.get("/:id", requirePermission("manage:orders"), asyncHandler(controller.getById));
  
  router.post("/", requirePermission("manage:orders"), validateRequest({ body: createCouponSchema }), asyncHandler(controller.create));
  router.patch("/:id", requirePermission("manage:orders"), validateRequest({ body: updateCouponSchema }), asyncHandler(controller.update));
  router.delete("/:id", requirePermission("manage:orders"), asyncHandler(controller.delete));

  return router;
}
