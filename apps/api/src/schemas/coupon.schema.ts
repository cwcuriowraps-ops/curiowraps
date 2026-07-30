import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, "Only uppercase letters, numbers, hyphens, and underscores allowed"),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  cartTotal: z.number().min(0, "Cart total must be positive"),
});
