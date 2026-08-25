import type { Prisma } from "@dashboard/database";

const userAuthSelect = {
  id: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  status: true,
  deletedAt: true,
  emailVerifiedAt: true,
  dateOfBirth: true,
  gender: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          permission: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  },
};

export class UserRepository {
  constructor(private readonly prisma: any) {}

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: userAuthSelect,
      });
      return user;
    } catch (error) {
      console.error("[UserRepository] findByEmail failed", { email, error });
      throw error;
    }
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: userAuthSelect,
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: userAuthSelect,
    });
  }

  updateLastLoginAt(id: string, lastLoginAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt },
      select: { id: true, lastLoginAt: true },
    });
  }
}
