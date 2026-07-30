import { Router } from "express";

import { changePasswordSchema, changeEmailSchema, updateProfileSchema, createAddressSchema, updateAddressSchema } from "../auth/profile-schemas";
import type { UserControllerDeps } from "../controllers/user.controller";
import { createUserController } from "../controllers/user.controller";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { createRequireAuth } from "../middleware/auth";

export function createUserRouter(deps: UserControllerDeps & { authService: any }) {
  const router = Router();
  const controller = createUserController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Apply authentication to all user routes
  router.use(requireAuth);

  router.get("/me", asyncHandler(controller.me));
  router.patch("/me", validateRequest({ body: updateProfileSchema }), asyncHandler(controller.updateProfile));
  router.post("/change-password", validateRequest({ body: changePasswordSchema }), asyncHandler(controller.changePassword));
  router.post("/change-email", validateRequest({ body: changeEmailSchema }), asyncHandler(controller.changeEmail));
  
  router.get("/sessions", asyncHandler(controller.listSessions));
  router.delete("/sessions", asyncHandler(controller.revokeAllSessions));
  router.delete("/sessions/:id", asyncHandler(controller.revokeSession));

  router.get("/addresses", asyncHandler(controller.listAddresses));
  router.post("/addresses", validateRequest({ body: createAddressSchema }), asyncHandler(controller.createAddress));
  router.put("/addresses/:id", validateRequest({ body: updateAddressSchema }), asyncHandler(controller.updateAddress));
  router.delete("/addresses/:id", asyncHandler(controller.deleteAddress));

  return router;
}
