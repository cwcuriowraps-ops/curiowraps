import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app";
import { createApiConfig } from "../config";

const config = createApiConfig({
  NODE_ENV: "test",
  PORT: "4000",
  STOREFRONT_URL: "http://localhost:3000",
  ADMIN_URL: "http://localhost:3001",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public",
});

const healthyPrisma = {
  $queryRawUnsafe: async (_query: string) => [{ 1: 1 }],
};

const failingPrisma = {
  $queryRawUnsafe: async (_query: string) => {
    throw new Error("Database unavailable");
  },
};

describe("Health endpoints", () => {
  const app = createApp({ config, prisma: healthyPrisma });

  it("GET /health returns ok status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.version).toBe("v1");
    expect(res.body.data.uptime).toBeTypeOf("number");
    expect(res.body.data.timestamp).toBeTypeOf("string");
  });

  it("GET /api/v1/health returns wrapped response", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("GET /api/v1/health validates its query string", async () => {
    const res = await request(app).get("/api/v1/health?includeDatabase=maybe");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/health can include database checks", async () => {
    const res = await request(app).get("/api/v1/health?includeDatabase=true");

    expect(res.status).toBe(200);
    expect(res.body.data.services.database).toBe("ok");
  });

  it("GET /api/v1/live returns liveness status", async () => {
    const res = await request(app).get("/api/v1/live");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("GET /api/v1/ready returns ready when the database is reachable", async () => {
    const res = await request(app).get("/api/v1/ready");

    expect(res.status).toBe(200);
    expect(res.body.data.services.database).toBe("ok");
  });

  it("GET /api/v1/ready returns 503 when the database is not reachable", async () => {
    const failingApp = createApp({ config, prisma: failingPrisma });
    const res = await request(failingApp).get("/api/v1/ready");

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("GET /nonexistent returns 404", async () => {
    const res = await request(app).get("/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("GET /api/docs.json returns OpenAPI spec", async () => {
    const res = await request(app).get("/api/docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.paths["/api/v1/health"]).toBeDefined();
  });
});
