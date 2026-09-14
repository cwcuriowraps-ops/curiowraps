import { appConfig } from "@dashboard/config";
import { z } from "zod";

const defaultDatabaseUrl =
  "postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public";

const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  STOREFRONT_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_URL: z.string().url().default("http://localhost:3001"),
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-access-token-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-refresh-token-secret-change-me"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  AUTH_COOKIE_NAME: z.string().default("refresh_token"),
  AUTH_COOKIE_PATH: z.string().default("/api/v1/auth"),
  AUTH_COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(14).default(12),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BREVO_SMTP_HOST: z.string().default("smtp-relay.brevo.com"),
  BREVO_SMTP_PORT: z.coerce.number().default(587),
  BREVO_SMTP_USER: z.string().optional(),
  BREVO_SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@curiowrap.com"),
});

export interface ApiConfig {
  name: string;
  apiVersion: string;
  apiPrefix: string;
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  directUrl?: string;
  storefrontUrl: string;
  adminUrl: string;
  corsOrigins: string[];
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  authCookieName: string;
  authCookiePath: string;
  authCookieSameSite: "lax" | "strict" | "none";
  authCookieSecure: boolean;
  authCookieDomain?: string;
  bcryptRounds: number;
  redisUrl?: string;
  brevoSmtpHost: string;
  brevoSmtpPort: number;
  brevoSmtpUser?: string;
  brevoSmtpPass?: string;
  emailFrom: string;
}

function validatePostgresUrl(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("postgresql://") && !trimmed.startsWith("postgres://")) {
    throw new Error(`${label} must be a PostgreSQL connection string.`);
  }

  return trimmed;
}

export const DEFAULT_PRODUCTION_ORIGINS = [
  "https://curiowraps-storefront.vercel.app",
  "https://curiowraps-admin.vercel.app",
];

function parseCorsOrigins(rawOrigins: string | undefined, defaults: string[]) {
  if (!rawOrigins) {
    return [...new Set(defaults.map((origin) => origin.trim().replace(/\/+$/, "")).filter(Boolean))];
  }

  return [...new Set(rawOrigins.split(",").map((origin) => origin.trim().replace(/\/+$/, "")).filter(Boolean))];
}

export function createApiConfig(env: typeof process.env = process.env): ApiConfig {
  const parsed = runtimeEnvSchema.parse(env);

  // Strict production startup validation
  if (parsed.NODE_ENV === "production") {
    const missing: string[] = [];

    if (!parsed.DATABASE_URL || parsed.DATABASE_URL.includes("localhost") || parsed.DATABASE_URL.includes("127.0.0.1")) {
      missing.push("DATABASE_URL must point to a remote PostgreSQL database (not localhost) in production");
    }
    if (parsed.JWT_ACCESS_SECRET === "dev-access-token-secret-change-me" || parsed.JWT_ACCESS_SECRET.length < 32) {
      missing.push("JWT_ACCESS_SECRET must be a secure random string (at least 32 characters) in production");
    }
    if (parsed.JWT_REFRESH_SECRET === "dev-refresh-token-secret-change-me" || parsed.JWT_REFRESH_SECRET.length < 32) {
      missing.push("JWT_REFRESH_SECRET must be a secure random string (at least 32 characters) in production");
    }
    if (parsed.STOREFRONT_URL.includes("localhost") || parsed.STOREFRONT_URL.includes("127.0.0.1")) {
      missing.push("STOREFRONT_URL must be configured with a production domain (not localhost) in production");
    }
    if (parsed.ADMIN_URL.includes("localhost") || parsed.ADMIN_URL.includes("127.0.0.1")) {
      missing.push("ADMIN_URL must be configured with a production domain (not localhost) in production");
    }


    if (missing.length > 0) {
      throw new Error(
        `[Config Error] Missing or insecure production environment configuration:\n  - ${missing.join("\n  - ")}`
      );
    }
  }

  return {
    name: appConfig.name,
    apiVersion: appConfig.apiVersion,
    apiPrefix: appConfig.apiPrefix,
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databaseUrl: validatePostgresUrl(parsed.DATABASE_URL ?? defaultDatabaseUrl, "DATABASE_URL"),
    directUrl: parsed.DIRECT_URL
      ? validatePostgresUrl(parsed.DIRECT_URL, "DIRECT_URL")
      : undefined,
    storefrontUrl: parsed.STOREFRONT_URL,
    adminUrl: parsed.ADMIN_URL,
    corsOrigins: parseCorsOrigins(parsed.CORS_ORIGINS, [
      parsed.STOREFRONT_URL,
      parsed.ADMIN_URL,
      ...DEFAULT_PRODUCTION_ORIGINS,
    ]),
    logLevel: parsed.LOG_LEVEL,
    jwtAccessSecret: parsed.JWT_ACCESS_SECRET,
    jwtRefreshSecret: parsed.JWT_REFRESH_SECRET,
    jwtAccessExpiresIn: parsed.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: parsed.JWT_REFRESH_EXPIRES_IN,
    authCookieName: parsed.AUTH_COOKIE_NAME,
    authCookiePath: parsed.AUTH_COOKIE_PATH,
    authCookieSameSite: parsed.AUTH_COOKIE_SAMESITE,
    authCookieSecure:
      parsed.AUTH_COOKIE_SECURE ? parsed.AUTH_COOKIE_SECURE === "true" : parsed.NODE_ENV === "production",
    authCookieDomain: parsed.AUTH_COOKIE_DOMAIN,
    bcryptRounds: parsed.BCRYPT_ROUNDS,
    redisUrl: parsed.REDIS_URL,
    brevoSmtpHost: parsed.BREVO_SMTP_HOST,
    brevoSmtpPort: parsed.BREVO_SMTP_PORT,
    brevoSmtpUser: parsed.BREVO_SMTP_USER,
    brevoSmtpPass: parsed.BREVO_SMTP_PASS,
    emailFrom: parsed.EMAIL_FROM,
  };
}