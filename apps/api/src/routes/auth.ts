import { Router } from "express";

import { authCookieSchema, loginSchema, logoutSchema, refreshSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "../auth/schemas";
import type { AuthControllerDeps } from "../controllers/auth.controller";
import { createAuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../lib/async-handler";
import { validateRequest } from "../lib/validate";
import { createRequireAuth } from "../middleware/auth";
import { createAuthRateLimiter } from "../middleware/rate-limiter";
import type { RedisService } from "../services/redis.service";

export interface AuthRouterDeps extends AuthControllerDeps {
  redisService: RedisService;
}

export function createAuthRouter(deps: AuthRouterDeps) {
  const router = Router();
  const controller = createAuthController(deps);
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });
  const authRateLimiter = createAuthRateLimiter(deps.redisService);

  router.post("/register", authRateLimiter, validateRequest({ body: registerSchema }), asyncHandler(controller.register));
  router.post("/login", authRateLimiter, validateRequest({ body: loginSchema }), asyncHandler(controller.login));
  router.post(
    "/refresh",
    authRateLimiter,
    validateRequest({ body: refreshSchema, cookies: authCookieSchema }),
    asyncHandler(controller.refresh),
  );
  router.post(
    "/logout",
    validateRequest({ body: logoutSchema, cookies: authCookieSchema }),
    asyncHandler(controller.logout),
  );
  router.get("/me", requireAuth, asyncHandler(controller.me));
  
  router.post("/oauth", authRateLimiter, asyncHandler(controller.oauthLogin));
  router.post("/forgot-password", authRateLimiter, validateRequest({ body: forgotPasswordSchema }), asyncHandler(controller.forgotPassword));
  router.post("/reset-password", authRateLimiter, validateRequest({ body: resetPasswordSchema }), asyncHandler(controller.resetPassword));

  return router;
}
