import { Router } from "express";

import { createShippingController } from "../controllers/shipping.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicShippingRouter(deps: any) {
  const router = Router();
  const controller = createShippingController(deps);

  router.get("/zones", asyncHandler(controller.getAllZones));

  return router;
}
