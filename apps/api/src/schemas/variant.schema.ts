import { z } from "zod";

export const createVariantSchema = z.object({
  productId: z.string().uuid("Invalid Product ID"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  optionValues: z.record(z.any()).optional().default({}),
  price: z.number().min(0, "Price must be positive"),
  compareAtPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  currency: z.string().length(3).default("USD"),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateVariantSchema = createVariantSchema.partial();
