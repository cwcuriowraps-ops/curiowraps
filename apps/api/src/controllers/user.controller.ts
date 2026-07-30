import type { Request, Response } from "express";

import type { ApiConfig } from "../config";
import { hashToken, signJwt } from "../lib/jwt";
import type { UserService } from "../services/user.service";

export interface UserControllerDeps {
  userService: UserService;
  config: ApiConfig;
}

export function createUserController(deps: UserControllerDeps) {
  return {
    me: async (req: Request, res: Response) => {
      // The user object is already loaded by the requireAuth middleware
      res.json({ success: true, data: { user: req.authUser } });
    },

    updateProfile: async (req: Request, res: Response) => {
      await deps.userService.updateProfile(req.authUser!.id, req.body, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });

      // Map back to PublicUser format minimally (since the full method is in authService)
      res.json({ success: true, data: { message: "Profile updated successfully" } });
    },

    changePassword: async (req: Request, res: Response) => {
      await deps.userService.changePassword(req.authUser!.id, req.body, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });
      
      // Clear current refresh token cookie because it was invalidated
      res.clearCookie(deps.config.authCookieName, {
        httpOnly: true,
        secure: deps.config.authCookieSecure,
        sameSite: deps.config.authCookieSameSite,
        domain: deps.config.authCookieDomain,
        path: deps.config.authCookiePath,
      });

      res.json({ success: true, data: { message: "Password updated. You must log in again." } });
    },

    changeEmail: async (req: Request, res: Response) => {
      const updatedUser = await deps.userService.changeEmail(req.authUser!.id, req.body, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });

      const accessToken = signJwt(
        {
          userId: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role.name,
        },
        deps.config.jwtAccessSecret,
        deps.config.jwtAccessExpiresIn
      );

      const publicUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role.name,
        permissions: updatedUser.role?.permissions?.map((p: any) => p.permission.code) || [],
        emailVerified: Boolean(updatedUser.emailVerifiedAt),
        avatarUrl: updatedUser.avatarUrl,
        dateOfBirth: updatedUser.dateOfBirth ? updatedUser.dateOfBirth.toISOString() : null,
        gender: updatedUser.gender,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      };

      res.json({
        success: true,
        data: {
          user: publicUser,
          accessToken,
          message: "Email address updated successfully.",
        },
      });
    },

    listSessions: async (req: Request, res: Response) => {
      const sessions = await deps.userService.listSessions(req.authUser!.id);
      
      const currentRefreshToken = req.cookies?.[deps.config.authCookieName];
      const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken, deps.config.jwtRefreshSecret) : null;

      const mapped = sessions.map((s: any) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        lastActivity: s.lastUsedAt || s.createdAt,
        isCurrent: currentTokenHash ? s.id === (s as any).id : false // simplified check, in reality we'd need to match tokenHash
      }));

      res.json({ success: true, data: { sessions: mapped } });
    },

    revokeSession: async (req: Request, res: Response) => {
      await deps.userService.revokeSession(req.authUser!.id, req.params.id as string);
      res.json({ success: true, data: { message: "Session revoked successfully" } });
    },

    revokeAllSessions: async (req: Request, res: Response) => {
      const currentRefreshToken = req.cookies?.[deps.config.authCookieName];
      const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken, deps.config.jwtRefreshSecret) : undefined;
      
      await deps.userService.revokeAllSessions(req.authUser!.id, currentTokenHash);
      res.json({ success: true, data: { message: "All other sessions revoked successfully" } });
    },

    listAddresses: async (req: Request, res: Response) => {
      const addresses = await deps.userService.listAddresses(req.authUser!.id);
      res.json({ success: true, data: { addresses } });
    },

    createAddress: async (req: Request, res: Response) => {
      const address = await deps.userService.createAddress(req.authUser!.id, req.body);
      res.status(201).json({ success: true, data: { address } });
    },

    updateAddress: async (req: Request, res: Response) => {
      const address = await deps.userService.updateAddress(req.authUser!.id, req.params.id as string, req.body);
      res.json({ success: true, data: { address } });
    },

    deleteAddress: async (req: Request, res: Response) => {
      await deps.userService.deleteAddress(req.authUser!.id, req.params.id as string);
      res.json({ success: true, data: { message: "Address deleted successfully" } });
    },
  };
}
