import type { UserRole } from "@dashboard/types";

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedUser extends PublicUser {
  roleId: string;
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthSessionResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
