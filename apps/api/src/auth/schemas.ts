import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
}).partial();

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
}).partial();

export const authCookieSchema = z.object({
  refresh_token: z.string().min(1).optional(),
}).partial();

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
