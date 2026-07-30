import { Router } from "express";

import { createVariantController } from "../controllers/variant.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicVariantRouter(deps: any) {
  const router = Router();
  const controller = createVariantController(deps);

  router.get("/", asyncHandler(controller.getAll));
  router.get("/:id", asyncHandler(controller.getById));

  return router;
}
