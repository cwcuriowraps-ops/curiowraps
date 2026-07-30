export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type UserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" | "STAFF";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheck {
  status: "ok" | "degraded" | "error";
  version: string;
  uptime: number;
  timestamp: string;
  services?: Record<string, "ok" | "error">;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "RAZORPAY" | "COD";

export interface Money {
  amount: string;
  currency: string;
}
