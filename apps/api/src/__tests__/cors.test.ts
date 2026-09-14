import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";
import { createApiConfig } from "../config";

describe("Production CORS & OPTIONS preflight suite", () => {
  const productionConfig = createApiConfig({
    NODE_ENV: "production",
    PORT: "4100",
    STOREFRONT_URL: "https://curiowraps-storefront.vercel.app",
    ADMIN_URL: "https://curiowraps-admin.vercel.app",
    CORS_ORIGINS: "https://curiowraps-storefront.vercel.app,https://curiowraps-admin.vercel.app",
    DATABASE_URL: "postgresql://postgres:postgres@db:5432/ecommerce",
    DIRECT_URL: "postgresql://postgres:postgres@db:5432/ecommerce-direct",
    JWT_ACCESS_SECRET: "this-is-a-32-character-jwt-access-secret-for-test",
    JWT_REFRESH_SECRET: "this-is-a-32-character-jwt-refresh-secret-for-test",
    LOG_LEVEL: "silent",
  });

  const app = createApp({ config: productionConfig });

  it("handles OPTIONS preflight from production storefront correctly", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://curiowraps-storefront.vercel.app")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps-storefront.vercel.app");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-methods"]).toContain("GET");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-methods"]).toContain("OPTIONS");
    expect(res.headers["access-control-max-age"]).toBe("86400");
  });

  it("handles OPTIONS preflight from production admin correctly", async () => {
    const res = await request(app)
      .options("/api/v1/auth/login")
      .set("Origin", "https://curiowraps-admin.vercel.app")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps-admin.vercel.app");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-max-age"]).toBe("86400");
  });

  it("allows Vercel preview deployments for storefront & admin", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://curiowraps-storefront-git-main.vercel.app")
      .set("Access-Control-Request-Method", "GET");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps-storefront-git-main.vercel.app");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("normalizes origin trailing slashes", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://curiowraps-storefront.vercel.app/")
      .set("Access-Control-Request-Method", "GET");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps-storefront.vercel.app/");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("includes CORS headers on regular GET /health request from storefront", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://curiowraps-storefront.vercel.app");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps-storefront.vercel.app");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.body.success).toBe(true);
  });

  it("handles OPTIONS preflight from custom domain https://curiowraps.studio correctly", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://curiowraps.studio")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps.studio");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-max-age"]).toBe("86400");
  });

  it("handles OPTIONS preflight from www custom domain https://www.curiowraps.studio correctly", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://www.curiowraps.studio")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Content-Type, Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://www.curiowraps.studio");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("handles OPTIONS preflight for /api/v1/auth/me from custom domain", async () => {
    const res = await request(app)
      .options("/api/v1/auth/me")
      .set("Origin", "https://curiowraps.studio")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "Authorization, Content-Type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps.studio");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("includes CORS headers on regular GET /health request from custom domain", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://curiowraps.studio");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps.studio");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.body.success).toBe(true);
  });

  it("includes CORS headers on /api/v1/auth/me request from custom domain", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Origin", "https://curiowraps.studio");

    // Even if unauthorized (401), CORS headers MUST be present!
    expect(res.headers["access-control-allow-origin"]).toBe("https://curiowraps.studio");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("rejects unauthorized origins cleanly without returning 500 error", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://malicious-site.com")
      .set("Access-Control-Request-Method", "GET");

    // Preflight from disallowed origin should NOT have access-control-allow-origin
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    // And should not crash the server with 500 internal error
    expect(res.status).not.toBe(500);
  });

  it("permits requests without Origin header (curl / server-to-server)", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
