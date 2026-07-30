import { appConfig } from "@dashboard/config";

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: `${appConfig.name} API`,
    version: appConfig.apiVersion,
    description: "Production-ready e-commerce REST API",
  },
  servers: [
    { url: "http://localhost:4000", description: "Development" },
    { url: `http://localhost:4000${appConfig.apiPrefix}`, description: "Versioned API" },
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management endpoints" },
    { name: "Categories", description: "Category endpoints" },
    { name: "Brands", description: "Brand endpoints" },
    { name: "Products", description: "Product catalog and variants" },
    { name: "Inventory", description: "Inventory management" },
    { name: "Search", description: "Product search" },
    { name: "Media", description: "Media Library" },
    { name: "Cart", description: "Shopping Cart" },
    { name: "Wishlist", description: "User Wishlist" },
    { name: "Coupons", description: "Discount Coupons" },
    { name: "Orders", description: "Order Management" },
    { name: "Shipping", description: "Shipping Zones and Rates" },
  ],
  components: {
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        required: ["code", "message"],
      },
      HealthCheck: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded", "error"] },
          version: { type: "string" },
          uptime: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
          services: {
            type: "object",
            additionalProperties: { type: "string", enum: ["ok", "error"] },
          },
        },
        required: ["status", "version", "uptime", "timestamp"],
      },
      ApiResponseHealth: {
        type: "object",
        properties: {
          success: { type: "boolean", const: true },
          data: { $ref: "#/components/schemas/HealthCheck" },
        },
        required: ["success", "data"],
      },
      ApiErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", const: false },
          error: { $ref: "#/components/schemas/ApiError" },
        },
        required: ["success", "error"],
      },
    },
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        parameters: [
          {
            name: "includeDatabase",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["true", "false"] },
            description: "Include a database connectivity check in the response",
          },
        ],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseHealth" },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/live": {
      get: {
        summary: "Liveness check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Process is alive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseHealth" },
              },
            },
          },
        },
      },
    },
    "/ready": {
      get: {
        summary: "Readiness check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseHealth" },
              },
            },
          },
          "503": {
            description: "Service is not ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    [`${appConfig.apiPrefix}/health`]: {
      get: {
        summary: "Versioned health check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseHealth" },
              },
            },
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    [`${appConfig.apiPrefix}/live`]: {
      get: {
        summary: "Versioned liveness check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Process is alive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseHealth" },
              },
            },
          },
        },
      },
    },
    [`${appConfig.apiPrefix}/ready`]: {
      get: {
        summary: "Versioned readiness check",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponseHealth" },
              },
            },
          },
          "503": {
            description: "Service is not ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiErrorResponse" },
              },
            },
          },
        },
      },
    },
    [`${appConfig.apiPrefix}/auth/register`]: {
      post: {
        summary: "Register new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  confirmPassword: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                },
                required: ["email", "password", "confirmPassword", "firstName", "lastName"],
              },
            },
          },
        },
        responses: {
          "201": { description: "User registered successfully" },
          "400": { description: "Validation error" },
          "409": { description: "Email already exists" },
        },
      },
    },
    [`${appConfig.apiPrefix}/auth/login`]: {
      post: {
        summary: "Login user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "User logged in successfully" },
          "400": { description: "Validation error" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    [`${appConfig.apiPrefix}/auth/refresh`]: {
      post: {
        summary: "Refresh access token",
        tags: ["Auth"],
        responses: {
          "200": { description: "Token refreshed successfully" },
          "401": { description: "Invalid or missing refresh token" },
        },
      },
    },
    [`${appConfig.apiPrefix}/auth/logout`]: {
      post: {
        summary: "Logout user",
        tags: ["Auth"],
        responses: {
          "200": { description: "Logged out successfully" },
        },
      },
    },
    [`${appConfig.apiPrefix}/auth/me`]: {
      get: {
        summary: "Get current user profile",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Current user profile" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${appConfig.apiPrefix}/users/me`]: {
      get: {
        summary: "Get current user profile",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Current user profile" },
          "401": { description: "Unauthorized" },
        },
      },
      patch: {
        summary: "Update current user profile",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          "200": { description: "Profile updated successfully" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${appConfig.apiPrefix}/users/change-password`]: {
      post: {
        summary: "Change password",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          "200": { description: "Password changed successfully" },
          "400": { description: "Validation error or incorrect password" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${appConfig.apiPrefix}/users/sessions`]: {
      get: {
        summary: "Get active sessions",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "List of active sessions" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        summary: "Revoke all other sessions",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Sessions revoked" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${appConfig.apiPrefix}/users/sessions/{id}`]: {
      delete: {
        summary: "Revoke a specific session",
        tags: ["Auth"],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Session revoked" },
          "401": { description: "Unauthorized" },
          "404": { description: "Session not found" },
        },
      },
    },
    [`${appConfig.apiPrefix}/admin/users`]: {
      get: {
        summary: "List all users",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "List of users" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - Insufficient permissions" },
        },
      },
    },
  },
};