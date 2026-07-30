import { Router } from "express";

import { createProductController } from "../controllers/product.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicProductRouter(deps: any) {
  const router = Router();
  const controller = createProductController(deps);

  router.get("/", asyncHandler(controller.getAll));
  router.get("/:slug", asyncHandler(controller.getBySlug));

  return router;
}
