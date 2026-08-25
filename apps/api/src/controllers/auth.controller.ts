import type { Request, Response } from "express";

import type { ApiConfig } from "../config";
import { AppError } from "../middleware/error-handler";
import type { AuthService } from "../services/auth.service";

export interface AuthControllerDeps {
  authService: AuthService;
  config: ApiConfig;
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date, config: ApiConfig) {
  res.cookie(config.authCookieName, token, {
    httpOnly: true,
    secure: config.authCookieSecure,
    sameSite: config.authCookieSameSite,
    domain: config.authCookieDomain,
    path: config.authCookiePath,
    expires: expiresAt,
  });
}

function clearRefreshCookie(res: Response, config: ApiConfig) {
  res.clearCookie(config.authCookieName, {
    httpOnly: true,
    secure: config.authCookieSecure,
    sameSite: config.authCookieSameSite,
    domain: config.authCookieDomain,
    path: config.authCookiePath,
  });
}

export function createAuthController(deps: AuthControllerDeps) {
  return {
    register: async (req: Request, res: Response) => {
      const result = await deps.authService.register(req.body, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });

      setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt, deps.config);
      res.status(201).json({ success: true, data: { user: result.user, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken } });
    },

    login: async (req: Request, res: Response) => {
      const result = await deps.authService.login(req.body, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });

      setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt, deps.config);
      res.json({ success: true, data: { user: result.user, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken } });
    },

    refresh: async (req: Request, res: Response) => {
      const refreshToken = req.cookies?.[deps.config.authCookieName] ?? req.body.refreshToken;

      if (!refreshToken) {
        throw new AppError(401, "MISSING_REFRESH_TOKEN", "Refresh token is required");
      }

      const result = await deps.authService.refresh(refreshToken, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });

      setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt, deps.config);
      res.json({ success: true, data: { user: result.user, accessToken: result.tokens.accessToken, refreshToken: result.tokens.refreshToken } });
    },

    logout: async (req: Request, res: Response) => {
      const refreshToken = req.cookies?.[deps.config.authCookieName] ?? req.body.refreshToken;

      if (refreshToken) {
        await deps.authService.logout(refreshToken);
      }

      clearRefreshCookie(res, deps.config);
      res.json({ success: true, data: { message: "Logged out successfully" } });
    },

    me: async (req: Request, res: Response) => {
      res.json({ success: true, data: { user: req.authUser } });
    },

    oauthLogin: async (req: Request, res: Response) => {
      const { provider, idToken } = req.body;
      if (!idToken || (provider !== "GOOGLE" && provider !== "APPLE")) {
        throw new AppError(400, "BAD_REQUEST", "Provider and idToken are required");
      }

      const result = await deps.authService.oauthLogin(provider, idToken, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });

      setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt, deps.config);
      res.json({ success: true, data: { user: result.user, accessToken: result.tokens.accessToken } });
    },

    forgotPassword: async (req: Request, res: Response) => {
      const { email } = req.body;
      console.info("[ForgotPassword][Controller] Entered", { email });
      try {
        if (!email) {
          throw new AppError(400, "BAD_REQUEST", "Email is required");
        }

        await deps.authService.forgotPassword(email);
        res.status(200).json({ success: true, data: { message: "If an account exists with this email, you'll receive a password reset link." } });
        console.info("[ForgotPassword][Controller] Success", { status: 200, email });
      } catch (error: any) {
        console.error("[ForgotPassword][Controller] Exception", {
          message: error?.message,
          stack: error?.stack,
          email,
        });
        console.error("[ForgotPassword][Controller] Failure", { status: error instanceof AppError ? error.statusCode : 500, email });
        throw error;
      }
    },

    resetPassword: async (req: Request, res: Response) => {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new AppError(400, "BAD_REQUEST", "Token and new password are required");
      }

      await deps.authService.resetPassword(token, newPassword);
      res.json({ success: true, data: { message: "Password reset successfully" } });
    },
  };
}
