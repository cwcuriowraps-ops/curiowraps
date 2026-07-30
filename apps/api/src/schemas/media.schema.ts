import { z } from "zod";

export const uploadMediaSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().int().min(1, "Size is required"),
  url: z.string().url("Invalid URL"),
  altText: z.string().optional(),
  title: z.string().optional(),
  folder: z.string().optional(),
});

export const updateMediaSchema = z.object({
  altText: z.string().optional(),
  title: z.string().optional(),
  folder: z.string().optional(),
});
