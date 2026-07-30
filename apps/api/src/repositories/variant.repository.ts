import type { Prisma, PrismaClient } from "@dashboard/database";

export class VariantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(productId: string, includeInactive = false) {
    return this.prisma.productVariant.findMany({
      where: {
        productId,
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string, includeDeleted = false) {
    return this.prisma.productVariant.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
      },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.productVariant.findFirst({ where: { sku, deletedAt: null } });
  }

  async findByBarcode(barcode: string) {
    return this.prisma.productVariant.findFirst({ where: { barcode, deletedAt: null } });
  }

  async create(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({ data });
  }

  async update(id: string, data: Prisma.ProductVariantUpdateInput) {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.productVariant.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.productVariant.update({ where: { id }, data: { deletedAt: null } });
  }
}
