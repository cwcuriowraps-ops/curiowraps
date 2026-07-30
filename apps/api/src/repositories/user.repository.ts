import type { Prisma } from "@dashboard/database";

export class UserRepository {
  constructor(private readonly prisma: any) {}

  async findByEmail(email: string) {
    // NOTE: Do NOT add a $queryRaw ping here — under Supabase pgBouncer Transaction Mode
    // every statement checks out a connection. A separate ping before the real query
    // doubles the checkout count and causes P1001 pool-exhaustion errors.
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
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
      return user;
    } catch (error) {
      console.error("[UserRepository] findByEmail failed", { email, error });
      throw error;
    }
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
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
  }

  updateLastLoginAt(id: string, lastLoginAt: Date) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt },
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
  }
}
