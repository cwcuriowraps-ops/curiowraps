import { describe, expect, it } from "vitest";

import { createApiConfig } from "../config";

describe("createApiConfig", () => {
  it("builds a validated runtime config", () => {
    const config = createApiConfig({
      NODE_ENV: "production",
      PORT: "4100",
      STOREFRONT_URL: "https://store.example.com",
      ADMIN_URL: "https://admin.example.com",
      CORS_ORIGINS: "https://app.example.com, https://admin.example.com",
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/ecommerce",
      DIRECT_URL: "postgresql://postgres:postgres@db:5432/ecommerce-direct",
      JWT_ACCESS_SECRET: "this-is-a-32-character-jwt-access-secret-for-test",
      JWT_REFRESH_SECRET: "this-is-a-32-character-jwt-refresh-secret-for-test",
      LOG_LEVEL: "warn",
    });

    expect(config.port).toBe(4100);
    expect(config.nodeEnv).toBe("production");
    expect(config.databaseUrl).toContain("postgresql://");
    expect(config.directUrl).toContain("postgresql://");
    expect(config.corsOrigins).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
    ]);
    expect(config.logLevel).toBe("warn");
    expect(config.authCookieSameSite).toBe("none");
    expect(config.authCookieSecure).toBe(true);
  });

  it("preserves explicit auth cookie settings", () => {
    const config = createApiConfig({
      NODE_ENV: "development",
      PORT: "4000",
      STOREFRONT_URL: "http://localhost:3000",
      ADMIN_URL: "http://localhost:3001",
      AUTH_COOKIE_SAMESITE: "lax",
      AUTH_COOKIE_SECURE: "false",
    });

    expect(config.authCookieSameSite).toBe("lax");
    expect(config.authCookieSecure).toBe(false);
  });

  it("rejects non-PostgreSQL connection strings", () => {
    expect(() =>
      createApiConfig({
        DATABASE_URL: "mysql://root:root@localhost:3306/ecommerce",
      }),
    ).toThrow("DATABASE_URL must be a PostgreSQL connection string.");
  });
});