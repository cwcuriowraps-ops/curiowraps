import { Router } from "express";

import type { ApiDependencies } from "../../context";
import { createContactController } from "../../controllers/contact.controller";
import { asyncHandler } from "../../lib/async-handler";

export function createPublicContactRouter(deps: ApiDependencies) {
  const router = Router();
  const controller = createContactController({
    contactRepository: deps.contactRepository,
  });

  router.post("/", asyncHandler(controller.submitContactForm));

  return router;
}
