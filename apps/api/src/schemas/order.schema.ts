import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddress: z.any(),
  billingAddress: z.any().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["UPI", "COD"]),
  notes: z.string().max(1000).optional(),
  upiTransactionId: z.string().trim().min(6, "Transaction ID must be at least 6 characters").max(50, "Transaction ID too long").optional(),
  buyNowItem: z.object({
    variantId: z.string(),
    quantity: z.number().int().positive(),
    customization: z.string().optional()
  }).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const updateOrderPaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED", "CANCELLED"]),
});
