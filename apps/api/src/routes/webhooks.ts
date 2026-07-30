import { Router } from "express";

import type { ApiDependencies } from "../context";
import { PaymentController } from "../controllers/payment.controller";

export function createWebhookRouter({
  paymentService,
}: ApiDependencies): Router {
  const router = Router();
  const paymentController = new PaymentController(paymentService!);

  router.post("/razorpay", paymentController.handleWebhook);

  return router;
}
