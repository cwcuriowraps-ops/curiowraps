import { Router } from "express";

import { createWishlistController } from "../controllers/wishlist.controller";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { createRequireAuth } from "../middleware/auth";
import { addToWishlistSchema } from "../schemas/wishlist.schema";

export function createPublicWishlistRouter(deps: any) {
  const router = Router();
  const controller = createWishlistController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", asyncHandler(controller.getWishlist));
  router.post("/", validateRequest({ body: addToWishlistSchema }), asyncHandler(controller.addItem));
  router.delete("/:productId", asyncHandler(controller.removeItem));
  router.delete("/", asyncHandler(controller.clearWishlist));
  router.post("/:productId/move-to-cart", asyncHandler(controller.moveToCart));

  return router;
}
