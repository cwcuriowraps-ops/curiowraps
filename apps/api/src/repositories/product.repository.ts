import type { Prisma, PrismaClient } from "@dashboard/database";

export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false) {
    return this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { status: "ACTIVE" }),
      },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPage(options: {
    includeInactive?: boolean;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    brandSlug?: string;
    isFeatured?: boolean;
    sort?: string;
    includeInventory?: boolean;
  }) {
    const {
      includeInactive = false,
      includeDeleted = false,
      page = 1,
      limit = 20,
      search,
      categoryId,
      brandId,
      brandSlug,
      isFeatured,
      sort,
      includeInventory = false,
    } = options;

    const where: any = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(includeInactive ? {} : { status: "ACTIVE" }),
      ...(isFeatured === undefined ? {} : { isFeatured }),
      ...(categoryId ? { categories: { some: { categoryId } } } : {}),
      ...(brandId ? { brandId } : {}),
      ...(brandSlug ? { brand: { slug: brandSlug } } : {}),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = sort === "createdAt_asc" ? ({ createdAt: "asc" } as const) : ({ createdAt: "desc" } as const);
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          brand: true,
          categories: { include: { category: true } },
          variants: {
            where: includeInactive ? {} : { deletedAt: null, isActive: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            ...(includeInventory ? { include: { inventory: true } } : {}),
          },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async findById(id: string, includeDeleted = false) {
    return this.prisma.product.findFirst({
      where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" }, deletedAt: null },
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: {
          where: { deletedAt: null, isActive: true },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      },
    });
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.product.update({ where: { id }, data: { deletedAt: null } });
  }
}
