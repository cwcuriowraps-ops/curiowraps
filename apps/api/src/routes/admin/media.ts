import { Router } from "express";

import { createMediaController } from "../../controllers/media.controller";
import { asyncHandler } from "../../lib/async-handler";
import { upload } from "../../lib/upload";
import { validateRequest } from "../../lib/validate";
import { createRequireAuth } from "../../middleware/auth";
import { requireAnyPermission } from "../../middleware/rbac";
import { updateMediaSchema } from "../../schemas/media.schema";

export function createAdminMediaRouter(deps: any) {
  const router = Router();
  const controller = createMediaController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", requireAnyPermission(["manage:products", "manage:categories", "manage:brands"]), asyncHandler(controller.getAll));
  router.get("/:id", requireAnyPermission(["manage:products", "manage:categories", "manage:brands"]), asyncHandler(controller.getById));
  
  router.post("/upload", requireAnyPermission(["manage:products", "manage:categories", "manage:brands"]), upload.single("file"), asyncHandler(controller.upload));
  router.patch("/:id", requireAnyPermission(["manage:products", "manage:categories", "manage:brands"]), validateRequest({ body: updateMediaSchema }), asyncHandler(controller.update));
  router.delete("/:id", requireAnyPermission(["manage:products", "manage:categories", "manage:brands"]), asyncHandler(controller.delete));

  return router;
}
