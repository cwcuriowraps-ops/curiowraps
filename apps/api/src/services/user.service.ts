
import { hashPassword, verifyPassword } from "../lib/password";
import { AppError } from "../middleware/error-handler";

import { AuditService } from "./audit.service";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangeEmailInput {
  newEmail: string;
  currentPassword?: string;
}

export class UserService {
  private readonly auditService: AuditService;

  constructor(private readonly prisma: any, private readonly bcryptRounds: number) {
    this.auditService = new AuditService(prisma);
  }

  async updateProfile(userId: string, data: UpdateProfileInput, context: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      },
    });

    await this.auditService.logAction({
      actorUserId: userId,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      before: { phone: user.phone, avatarUrl: user.avatarUrl }, // Subset of changed fields
      after: updateData,
      ...context,
    });

    return updatedUser;
  }

  async changePassword(userId: string, input: ChangePasswordInput, context: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

    const passwordMatches = await verifyPassword(input.currentPassword!, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(400, "INVALID_PASSWORD", "Current password does not match");
    }

    const newPasswordMatches = await verifyPassword(input.newPassword!, user.passwordHash);
    if (newPasswordMatches) {
      throw new AppError(400, "INVALID_PASSWORD", "New password cannot be the same as the current password");
    }

    const newPasswordHash = await hashPassword(input.newPassword!, this.bcryptRounds);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      // Invalidate all refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      const txAuditService = new AuditService(tx);
      await txAuditService.logAction({
        actorUserId: userId,
        action: "UPDATE",
        entityType: "User",
        entityId: userId,
        metadata: { field: "password" },
        ...context,
      });
    }, { maxWait: 10000, timeout: 20000 });
  }

  async changeEmail(userId: string, input: ChangeEmailInput, context: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }

    if (!input.currentPassword) {
      throw new AppError(400, "BAD_REQUEST", "Current password is required to change email address");
    }

    const passwordMatches = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, "INCORRECT_PASSWORD", "Incorrect password. Please try again.");
    }

    const normalizedEmail = input.newEmail.trim().toLowerCase();
    if (normalizedEmail === user.email.toLowerCase()) {
      throw new AppError(400, "BAD_REQUEST", "New email address must be different from your current email.");
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: userId },
      },
    });

    if (existingUser) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "An account with this email address already exists.");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        updatedAt: new Date(),
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    await this.auditService.logAction({
      actorUserId: userId,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      before: { email: user.email },
      after: { email: normalizedEmail },
      ...context,
    });

    return updatedUser;
  }

  async listSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  async revokeSession(userId: string, tokenId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { id: tokenId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new AppError(404, "NOT_FOUND", "Session not found or already revoked");
    }
  }

  async revokeAllSessions(userId: string, exceptTokenHash?: string) {
    if (exceptTokenHash) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null, tokenHash: { not: exceptTokenHash } },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAddress(userId: string, data: any) {
    if (data.isDefaultShipping) {
      await this.prisma.address.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (data.isDefaultBilling) {
      await this.prisma.address.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, data: any) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!address) throw new AppError(404, "NOT_FOUND", "Address not found");

    if (data.isDefaultShipping) {
      await this.prisma.address.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (data.isDefaultBilling) {
      await this.prisma.address.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!address) throw new AppError(404, "NOT_FOUND", "Address not found");

    return this.prisma.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });
  }
}
