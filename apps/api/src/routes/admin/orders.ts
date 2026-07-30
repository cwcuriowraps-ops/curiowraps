import { Router } from "express";

import { createOrderController } from "../../controllers/order.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { updateOrderStatusSchema, updateOrderPaymentStatusSchema } from "../../schemas/order.schema";

export function createAdminOrderRouter(deps: any) {
  const router = Router();
  const controller = createOrderController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", requirePermission("manage:orders"), asyncHandler(controller.getAll));
  router.get("/:id", requirePermission("manage:orders"), asyncHandler(controller.getById));
  router.patch("/:id/status", requirePermission("manage:orders"), validateRequest({ body: updateOrderStatusSchema }), asyncHandler(controller.updateStatus));
  router.patch("/:id/payment-status", requirePermission("manage:orders"), validateRequest({ body: updateOrderPaymentStatusSchema }), asyncHandler(controller.updatePaymentStatus));
  router.delete("/:id", requirePermission("manage:orders"), asyncHandler(controller.delete));

  return router;
}
