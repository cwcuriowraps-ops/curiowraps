import { z } from "zod";

export const createBrandSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional(),
  isActive: z.boolean().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();
