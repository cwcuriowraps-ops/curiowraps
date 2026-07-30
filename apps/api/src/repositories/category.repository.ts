import type { Prisma, PrismaClient } from "@dashboard/database";

export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false, isFeatured?: boolean) {
    return this.prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
      },
      include: {
        parent: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });
  }

  async findById(id: string, includeDeleted = false) {
    return this.prisma.category.findFirst({
      where: { 
        id, 
        ...(includeDeleted ? {} : { deletedAt: null }) 
      },
      include: {
        parent: true,
        children: {
          where: includeDeleted ? {} : { deletedAt: null },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    console.log("[Category Create][Prisma] Before slug query", { slug });
    try {
      const category = await this.prisma.category.findFirst({ where: { slug, deletedAt: null } });
      console.log("[Category Create][Prisma] After slug query", { exists: Boolean(category) });
      return category;
    } catch (error) {
      console.error("[Category Create][Prisma] Slug query exception", error);
      console.error("[Category Create][Prisma] Slug query stack", error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async create(data: Prisma.CategoryUncheckedCreateInput) {
    console.log("[Category Create][Prisma] Before create query", data);
    try {
      const category = await this.prisma.category.create({ data });
      console.log("[Category Create][Prisma] After create query", { categoryId: category.id });
      return category;
    } catch (error) {
      console.error("[Category Create][Prisma] Create query exception", error);
      console.error("[Category Create][Prisma] Create query stack", error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async update(id: string, data: Prisma.CategoryUncheckedUpdateInput) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
