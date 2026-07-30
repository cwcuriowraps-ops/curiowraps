import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  brandId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional().nullable()),
  categoryId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional().nullable()),
  basePrice: z.coerce.number().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DISCONTINUED"]).optional(),
  isFeatured: z.boolean().optional(),
  taxable: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
}).passthrough();

export const updateProductSchema = createProductSchema.partial().passthrough();
