import { Router } from "express";

import { createBrandController } from "../controllers/brand.controller";
import { asyncHandler } from "../lib/async-handler";
import { cacheControl } from "../middleware/cache-control";

export function createPublicBrandRouter(deps: any) {
  const router = Router();
  const controller = createBrandController(deps);

  router.get("/", cacheControl(300, 900, 1800), asyncHandler(controller.getAll));
  router.get("/:slug", cacheControl(300, 900, 1800), asyncHandler(controller.getBySlug));

  return router;
}

