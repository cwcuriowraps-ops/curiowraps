import { Router } from "express";

import { createShippingController } from "../../controllers/shipping.controller";
import { asyncHandler } from "../../lib/async-handler";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { createShippingZoneSchema, updateShippingZoneSchema, createShippingMethodSchema, createShippingRateSchema } from "../../schemas/shipping.schema";

export function createAdminShippingRouter(deps: any) {
  const router = Router();
  const controller = createShippingController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  // Zones
  router.get("/zones", requirePermission("manage:shipping"), asyncHandler(controller.getAllZones));
  router.get("/zones/:id", requirePermission("manage:shipping"), asyncHandler(controller.getZoneById));
  router.post("/zones", requirePermission("manage:shipping"), validateRequest({ body: createShippingZoneSchema }), asyncHandler(controller.createZone));
  router.patch("/zones/:id", requirePermission("manage:shipping"), validateRequest({ body: updateShippingZoneSchema }), asyncHandler(controller.updateZone));
  router.delete("/zones/:id", requirePermission("manage:shipping"), asyncHandler(controller.deleteZone));

  // Methods
  router.post("/methods", requirePermission("manage:shipping"), validateRequest({ body: createShippingMethodSchema }), asyncHandler(controller.createMethod));

  // Rates
  router.post("/rates", requirePermission("manage:shipping"), validateRequest({ body: createShippingRateSchema }), asyncHandler(controller.createRate));

  return router;
}
