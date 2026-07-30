import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  customization: z.string().max(500, "Customization instructions cannot exceed 500 characters").optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be at least 0 (0 to remove)"),
});
