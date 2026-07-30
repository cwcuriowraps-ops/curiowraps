import { Router } from "express";

import { createOrderController } from "../controllers/order.controller";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { createRequireAuth } from "../middleware/auth";
import { createOrderSchema } from "../schemas/order.schema";

export function createPublicOrderRouter(deps: any) {
  const router = Router();
  const controller = createOrderController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", asyncHandler(controller.getMyOrders));
  router.get("/:id", asyncHandler(controller.getById));
  router.post("/", validateRequest({ body: createOrderSchema }), asyncHandler(controller.createFromCart));

  return router;
}
