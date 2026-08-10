import { Router } from "express";

import { createProductController } from "../controllers/product.controller";
import { asyncHandler } from "../lib/async-handler";
import { cacheControl } from "../middleware/cache-control";

export function createPublicProductRouter(deps: any) {
  const router = Router();
  const controller = createProductController(deps);

  router.get("/", cacheControl(60, 300, 600), asyncHandler(controller.getAll));
  router.get("/:slug", cacheControl(60, 300, 600), asyncHandler(controller.getBySlug));

  return router;
}

