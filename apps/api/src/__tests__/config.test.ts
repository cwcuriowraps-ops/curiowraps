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
  });

  it("rejects non-PostgreSQL connection strings", () => {
    expect(() =>
      createApiConfig({
        DATABASE_URL: "mysql://root:root@localhost:3306/ecommerce",
      }),
    ).toThrow("DATABASE_URL must be a PostgreSQL connection string.");
  });
});