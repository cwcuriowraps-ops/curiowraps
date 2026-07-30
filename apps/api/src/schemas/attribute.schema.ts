import { z } from "zod";

export const createAttributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateAttributeSchema = createAttributeSchema.partial();

export const createAttributeValueSchema = z.object({
  value: z.string().min(1, "Value is required"),
  sortOrder: z.number().int().optional(),
});
