import request from "supertest";
import { describe, it, expect, vi } from "vitest";

import { app } from "../index";
// Basic placeholder test to cover auth routes. In a real environment, 
// we would mock Prisma or use a test database.

describe("Auth Endpoints", () => {
  it("should have /api/v1/auth/register route", async () => {
    // Just verifying that the route is registered and responds with validation error initially
    const res = await request(app).post("/api/v1/auth/register").send({});
    expect(res.status).toBe(400); // Bad Request (Zod validation)
  });

  it("should have /api/v1/auth/login route", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});
    expect(res.status).toBe(400); 
  });
  
  it("should have /api/v1/auth/refresh route", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").send({});
    expect(res.status).toBe(401); // Auth Error (missing token)
  });

  it("should have /api/v1/auth/logout route", async () => {
    const res = await request(app).post("/api/v1/auth/logout").send({});
    expect(res.status).toBe(200); // Logout without token succeeds and clears cookies
  });

  it("should block /api/v1/auth/me without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401); 
  });

  it("should have /api/v1/auth/oauth route and validate payload", async () => {
    const res = await request(app).post("/api/v1/auth/oauth").send({});
    expect(res.status).toBe(400);
    expect(res.body.error?.message).toContain("Provider and idToken are required");
  });

  it("oauthLogin controller returns user, accessToken, and refreshToken and sets cookie", async () => {
    const { createAuthController } = await import("../controllers/auth.controller");
    const mockAuthService: any = {
      oauthLogin: async () => ({
        user: { id: "user-1", email: "oauth@example.com" },
        tokens: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        },
      }),
    };

    const mockConfig: any = {
      authCookieName: "refresh_token",
      authCookiePath: "/api/v1/auth",
      authCookieSameSite: "none",
      authCookieSecure: true,
    };

    const controller = createAuthController({
      authService: mockAuthService,
      config: mockConfig,
    });

    const cookieMock = vi.fn();
    let jsonResponse: any = null;

    const mockReq: any = {
      body: { provider: "GOOGLE", idToken: "valid-id-token" },
      ip: "127.0.0.1",
      get: () => "TestAgent",
    };

    const mockRes: any = {
      cookie: cookieMock,
      json: (data: any) => {
        jsonResponse = data;
        return mockRes;
      },
    };

    await controller.oauthLogin(mockReq, mockRes);

    expect(cookieMock).toHaveBeenCalledWith(
      "refresh_token",
      "mock-refresh-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/api/v1/auth",
      })
    );

    expect(jsonResponse).toEqual({
      success: true,
      data: {
        user: { id: "user-1", email: "oauth@example.com" },
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    });
  });
});
