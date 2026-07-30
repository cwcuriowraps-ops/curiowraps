import type { Prisma, PrismaClient } from "@dashboard/database";

export class CouponRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false) {
    return this.prisma.coupon.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.coupon.findUnique({
      where: { id },
      include: {
        redemptions: true,
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.coupon.findUnique({
      where: { code },
      include: {
        redemptions: true,
      },
    });
  }

  async create(data: Prisma.CouponCreateInput) {
    return this.prisma.coupon.create({ data });
  }

  async update(id: string, data: Prisma.CouponUpdateInput) {
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }

  async recordRedemption(data: Prisma.CouponRedemptionCreateInput) {
    return this.prisma.couponRedemption.create({ data });
  }
}
