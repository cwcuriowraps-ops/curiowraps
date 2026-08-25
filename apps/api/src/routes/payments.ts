import { Router } from "express";

import type { ApiDependencies } from "../context";
import { PaymentController } from "../controllers/payment.controller";
import { createRequireAuth } from "../middleware/auth";

export function createPublicPaymentRouter({
  paymentService,
  authService,
  config,
}: ApiDependencies): Router {
  const router = Router();
  const paymentController = new PaymentController(paymentService!);
  const requireAuth = createRequireAuth({ authService: authService!, config });

  router.use(requireAuth);

  router.post("/upi/create", paymentController.createUpiPayment);
  router.post("/cod/create", paymentController.createCodPayment);

  return router;
}
