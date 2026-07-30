import type { Request, Response } from "express";

import type { AdminUserService } from "../services/admin-user.service";
import type { UserService } from "../services/user.service";

export interface AdminUserControllerDeps {
  adminUserService: AdminUserService;
  userService: UserService;
}

export function createAdminUserController(deps: AdminUserControllerDeps) {
  return {
    getMe: async (req: Request, res: Response) => {
      const user = await deps.adminUserService.getUser(req.authUser!.id);
      res.json({ success: true, data: { user } });
    },

    updateMe: async (req: Request, res: Response) => {
      const { firstName, lastName, phone, avatarUrl, currentPassword, newPassword } = req.body;
      const userId = req.authUser!.id;

      // Update basic profile
      let user = await deps.userService.updateProfile(userId, { firstName, lastName, phone, avatarUrl }, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      // Update password if provided
      if (currentPassword && newPassword) {
        user = await deps.userService.changePassword(userId, currentPassword, newPassword);
      }

      res.json({ success: true, data: { user } });
    },

    listUsers: async (req: Request, res: Response) => {
      // In reality, pull page/limit/status from req.query and validate with a Zod schema
      const status = req.query.status as any;
      const role = req.query.role as string;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await deps.adminUserService.listUsers({ status, role, search }, page, limit);
      res.json({ success: true, data: result });
    },

    getUser: async (req: Request, res: Response) => {
      const user = await deps.adminUserService.getUser(req.params.id as string);
      res.json({ success: true, data: { user } });
    },

    updateStatus: async (req: Request, res: Response) => {
      const { status } = req.body;
      const updatedUser = await deps.adminUserService.updateStatus(req.authUser!.id, req.params.id as string, status, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });
      res.json({ success: true, data: { user: updatedUser } });
    },

    assignRole: async (req: Request, res: Response) => {
      const { role } = req.body;
      const updatedUser = await deps.adminUserService.assignRole(req.authUser!.id, req.params.id as string, role, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });
      res.json({ success: true, data: { user: updatedUser } });
    },

    deleteUser: async (req: Request, res: Response) => {
      const deletedUser = await deps.adminUserService.deleteUser(req.authUser!.id, req.params.id as string, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
      });
      res.json({ success: true, data: { user: deletedUser }, message: "User deleted successfully" });
    },
  };
}
