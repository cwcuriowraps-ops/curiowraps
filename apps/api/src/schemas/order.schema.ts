import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddress: z.any(),
  billingAddress: z.any().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const updateOrderPaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"]),
});
