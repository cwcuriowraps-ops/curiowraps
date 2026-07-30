
import type { UserStatus } from "@prisma/client";

import { AppError } from "../middleware/error-handler";

import { AuditService } from "./audit.service";

export class AdminUserService {
  private readonly auditService: AuditService;

  constructor(private readonly prisma: any) {
    this.auditService = new AuditService(prisma);
  }

  async listUsers(filters: { status?: UserStatus; role?: string; search?: string }, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.role) where.role = { name: filters.role };
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { role: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        role: { include: { permissions: { include: { permission: true } } } },
        auditLogs: { take: 10, orderBy: { createdAt: "desc" } },
        orders: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { items: true } },
      },
    });

    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
    return user;
  }

  async updateStatus(adminId: string, userId: string, status: UserStatus, context: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
    
    // Prevent self-suspension if admin
    if (adminId === userId && status !== "ACTIVE") {
      throw new AppError(400, "BAD_REQUEST", "You cannot suspend your own account");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      include: { role: true },
    });

    let action = "UPDATE";
    if (status === "ACTIVE") action = "ACTIVATE";
    if (status === "SUSPENDED" || status === "DELETED") action = "DEACTIVATE";

    await this.auditService.logAction({
      actorUserId: adminId,
      action: action as any,
      entityType: "User",
      entityId: userId,
      before: { status: user.status },
      after: { status },
      ...context,
    });

    return updated;
  }

  async assignRole(adminId: string, userId: string, roleName: string, context: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new AppError(400, "BAD_REQUEST", "Invalid role");

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: true },
    });

    await this.auditService.logAction({
      actorUserId: adminId,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      metadata: { actionSubtype: "ASSIGN_ROLE" },
      before: { role: user.role.name },
      after: { role: role.name },
      ...context,
    });

    return updated;
  }

  async deleteUser(adminId: string, userId: string, context: any) {
    if (adminId === userId) {
      throw new AppError(400, "BAD_REQUEST", "You cannot delete your own account");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new AppError(404, "NOT_FOUND", "User not found");

    const deleted = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    await this.auditService.logAction({
      actorUserId: adminId,
      action: "DELETE",
      entityType: "User",
      entityId: userId,
      before: { status: user.status },
      after: { status: "DELETED" },
      ...context,
    });

    return deleted;
  }
}
