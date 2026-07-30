import type { Prisma, PrismaClient } from "@dashboard/database";

export class BrandRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false) {
    return this.prisma.brand.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findById(id: string, includeDeleted = false) {
    return this.prisma.brand.findFirst({
      where: { 
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.brand.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async findByName(name: string) {
    return this.prisma.brand.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async create(data: Prisma.BrandCreateInput) {
    return this.prisma.brand.create({
      data,
    });
  }

  async update(id: string, data: Prisma.BrandUpdateInput) {
    return this.prisma.brand.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
