import { Router } from "express";

import { createSearchController } from "../controllers/search.controller";
import { asyncHandler } from "../lib/async-handler";

export function createPublicSearchRouter(deps: any) {
  const router = Router();
  const controller = createSearchController(deps);

  router.get("/", asyncHandler(controller.search));

  return router;
}
