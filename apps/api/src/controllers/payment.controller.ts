import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { PaymentService } from "../services/payment.service";

const createUpiPaymentSchema = z.object({
  orderId: z.string().uuid(),
  upiTransactionId: z.string().trim().min(6).max(50).optional(),
});

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createUpiPayment = async (req: Request, res: Response, Next: NextFunction) => {
    try {
      const { orderId, upiTransactionId } = createUpiPaymentSchema.parse(req.body);
      const userId = req.authUser!.id;
      const payment = await this.paymentService.createUpiPayment(orderId, userId, upiTransactionId);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      Next(error);
    }
  };

  createCodPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = createPaymentSchema.parse(req.body);
      const userId = req.authUser!.id;
      const payment = await this.paymentService.createCodPayment(orderId, userId);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };
}
