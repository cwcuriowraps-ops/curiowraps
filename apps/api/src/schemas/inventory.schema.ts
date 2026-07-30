import { z } from "zod";

export const adjustInventorySchema = z.object({
  variantId: z.string().uuid("Invalid Variant ID"),
  locationId: z.string().uuid("Invalid Location ID"),
  quantityChange: z.number().int("Quantity must be an integer"),
  type: z.enum(["ADJUSTMENT", "SALE", "RETURN", "RESTOCK", "TRANSFER", "RESERVE", "RELEASE"]),
  referenceType: z.string().min(1),
  referenceId: z.string().optional(),
  note: z.string().optional(),
});
