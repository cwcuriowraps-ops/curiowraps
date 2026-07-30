import type { Prisma, PrismaClient } from "@dashboard/database";

export class OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(options: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const where: any = { deletedAt: null };

    if (options.search) {
      where.OR = [
        { orderNumber: { contains: options.search, mode: "insensitive" } },
        { user: { email: { contains: options.search, mode: "insensitive" } } },
        { user: { firstName: { contains: options.search, mode: "insensitive" } } },
        { user: { lastName: { contains: options.search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });
  }

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: { items: true },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: { items: true },
    });
  }

  async deleteOrder(id: string) {
    return this.prisma.order.delete({
      where: { id },
    });
  }
}
