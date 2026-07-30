import { Router } from "express";

import type { ApiDependencies } from "../context";
import { createSettingController } from "../controllers/setting.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicSettingRouter(deps: ApiDependencies) {
  const router = Router();
  const controller = createSettingController(deps);

  router.get("/", asyncHandler(controller.getAll));

  return router;
}
