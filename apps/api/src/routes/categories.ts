import { Router } from "express";

import { createCategoryController } from "../controllers/category.controller";
import { asyncHandler } from "../lib/async-handler";
import { cacheControl } from "../middleware/cache-control";

export function createPublicCategoryRouter(deps: any) {
  const router = Router();
  const controller = createCategoryController(deps);

  // Public category routes do not require authentication or specific permissions
  router.get("/", cacheControl(300, 900, 1800), asyncHandler(controller.getAll));
  router.get("/:slug", cacheControl(300, 900, 1800), asyncHandler(controller.getBySlug));

  return router;
}

