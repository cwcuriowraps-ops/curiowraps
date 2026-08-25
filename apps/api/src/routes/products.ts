import { Router } from "express";

import { createProductController } from "../controllers/product.controller";
import { asyncHandler } from "../lib/async-handler";
import { cacheControl } from "../middleware/cache-control";

export function createPublicProductRouter(deps: any) {
  const router = Router();
  const controller = createProductController(deps);

  router.get("/", cacheControl(), asyncHandler(controller.getAll));
  router.get("/:slug", cacheControl(), asyncHandler(controller.getBySlug));

  return router;
}

