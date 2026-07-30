import { z } from "zod";

const imageUrlSchema = z
  .union([
    z.string().refine(
      (val) => !val || val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:"),
      { message: "Must be a valid URL or path" }
    ),
    z.null(),
  ])
  .optional()
  .transform((val) => (val === "" ? null : val));

const parentIdSchema = z
  .union([
    z.string().uuid("Invalid parent ID format"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((val) => (val === "" ? null : val));

export const createCategorySchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  imageUrl: imageUrlSchema,
  parentId: parentIdSchema,
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
