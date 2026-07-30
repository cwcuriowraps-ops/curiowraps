import { Router } from "express";

import { createCategoryController } from "../controllers/category.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicCategoryRouter(deps: any) {
  const router = Router();
  const controller = createCategoryController(deps);

  // Public category routes do not require authentication or specific permissions
  router.get("/", asyncHandler(controller.getAll));
  router.get("/:slug", asyncHandler(controller.getBySlug));

  return router;
}
