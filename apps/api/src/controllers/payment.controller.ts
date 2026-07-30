import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { PaymentService } from "../services/payment.service";

const createRazorpaySchema = z.object({
  orderId: z.string().uuid(),
});

const verifyRazorpaySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

const createCodSchema = z.object({
  orderId: z.string().uuid(),
});

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  createRazorpayOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = createRazorpaySchema.parse(req.body);
      const userId = req.authUser!.id;
      const payment = await this.paymentService.createRazorpayOrder(orderId, userId);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };

  verifyRazorpayPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifyRazorpaySchema.parse(req.body);
      const userId = req.authUser!.id;
      const payment = await this.paymentService.verifyRazorpayPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId
      );
      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };

  createCodPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = createCodSchema.parse(req.body);
      const userId = req.authUser!.id;
      const payment = await this.paymentService.createCodPayment(orderId, userId);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      // In Express, when using express.raw(), req.body is a Buffer
      // We must verify the signature first
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "dummy_webhook_secret";
      const signature = req.headers["x-razorpay-signature"] as string;

      if (!signature) {
        res.status(400).send("Missing signature");
        return;
      }

      const crypto = await import("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      const expected = Buffer.from(generatedSignature);
      const received = Buffer.from(signature);
      const isValid = expected.length === received.length && crypto.timingSafeEqual(expected, received);

      if (!isValid) {
        res.status(400).send("Invalid signature");
        return;
      }

      // Payload is safe to parse now
      const payload = JSON.parse(req.body.toString());

      await this.paymentService.handleWebhook(payload.event, payload);

      res.status(200).send("OK");
    } catch (error) {
      // Don't leak error details to webhook
      console.error("Webhook error:", error);
      res.status(500).send("Internal Server Error");
    }
  };
}
