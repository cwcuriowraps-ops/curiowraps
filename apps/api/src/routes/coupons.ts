import { Router } from "express";

import { createCouponController } from "../controllers/coupon.controller";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { createRequireAuth } from "../middleware/auth";
import { validateCouponSchema } from "../schemas/coupon.schema";

export function createPublicCouponRouter(deps: any) {
  const router = Router();
  const controller = createCouponController(deps);
  const optionalAuth = createRequireAuth({ authService: deps.authService, config: deps.config, optional: true } as any);

  router.post("/validate", optionalAuth, validateRequest({ body: validateCouponSchema }), asyncHandler(controller.validate));

  return router;
}
