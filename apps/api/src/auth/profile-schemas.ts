import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(128),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().email("Please enter a valid email address."),
  currentPassword: z.string().min(1, "Current password is required to verify email change."),
});

export const createAddressSchema = z.object({
  label: z.string().trim().optional().nullable(),
  recipientName: z.string().trim().min(1, "Recipient name is required"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  line1: z.string().trim().min(1, "Address line 1 is required"),
  line2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().default("India"),
  isDefaultShipping: z.boolean().optional().default(false),
  isDefaultBilling: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
