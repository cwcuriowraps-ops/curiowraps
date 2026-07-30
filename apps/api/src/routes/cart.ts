import { Router } from "express";

import { createCartController } from "../controllers/cart.controller";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { createOptionalAuth, createRequireAuth } from "../middleware/auth";
import { addToCartSchema, updateCartItemSchema } from "../schemas/cart.schema";

export function createPublicCartRouter(deps: any) {
  const router = Router();
  const controller = createCartController(deps);
  const optionalAuth = createOptionalAuth({ authService: deps.authService, config: deps.config });
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Use optional auth for standard cart operations (supports guests)
  router.get("/", optionalAuth, asyncHandler(controller.getCart));
  router.post("/items", optionalAuth, validateRequest({ body: addToCartSchema }), asyncHandler(controller.addItem));
  router.patch("/items/:variantId", optionalAuth, validateRequest({ body: updateCartItemSchema }), asyncHandler(controller.updateItem));
  router.delete("/items/:variantId", optionalAuth, asyncHandler(controller.removeItem));
  router.delete("/", optionalAuth, asyncHandler(controller.clearCart));

  // Merging requires the user to be fully authenticated
  router.post("/merge", requireAuth, asyncHandler(controller.mergeCart));

  return router;
}
