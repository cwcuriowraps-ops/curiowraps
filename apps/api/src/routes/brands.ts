import { Router } from "express";

import { createBrandController } from "../controllers/brand.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicBrandRouter(deps: any) {
  const router = Router();
  const controller = createBrandController(deps);

  router.get("/", asyncHandler(controller.getAll));
  router.get("/:slug", asyncHandler(controller.getBySlug));

  return router;
}
