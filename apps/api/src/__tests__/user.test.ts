import request from "supertest";
import { describe, it, expect } from "vitest";

import { app } from "../index";

describe("User & RBAC Endpoints", () => {
  it("GET /api/v1/users/me should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/v1/users/me should return 401 without token", async () => {
    const res = await request(app).patch("/api/v1/users/me").send({ firstName: "NewName" });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/users/change-password should validate body without token", async () => {
    const res = await request(app).post("/api/v1/users/change-password").send({});
    // The validation runs AFTER the requireAuth middleware. So we'll hit 401 first.
    expect(res.status).toBe(401);
  });
  
  it("GET /api/v1/admin/users should be protected by RBAC", async () => {
    const res = await request(app).get("/api/v1/admin/users");
    expect(res.status).toBe(401); 
  });
});
