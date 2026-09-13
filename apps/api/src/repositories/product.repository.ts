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
    onlyDeleted?: boolean;
    status?: string;
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
      onlyDeleted = false,
      status,
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

    const isUuid = (val?: string) => val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const hasValidCategory = categoryId && categoryId.trim() !== "" && categoryId.trim().toLowerCase() !== "all";
    const hasValidBrandId = brandId && brandId.trim() !== "" && brandId.trim().toLowerCase() !== "all";
    const hasValidBrandSlug = brandSlug && brandSlug.trim() !== "" && brandSlug.trim().toLowerCase() !== "all";

    const where: any = {
      ...(isFeatured === undefined ? {} : { isFeatured }),
      ...(hasValidCategory
        ? isUuid(categoryId.trim())
          ? { categories: { some: { categoryId: categoryId.trim(), category: { deletedAt: null } } } }
          : { categories: { some: { category: { slug: { equals: categoryId.trim(), mode: "insensitive" }, deletedAt: null } } } }
        : {}),
      ...(hasValidBrandId ? { brandId: brandId.trim() } : {}),
      ...(hasValidBrandSlug ? { brand: { slug: { equals: brandSlug.trim(), mode: "insensitive" } } } : {}),
    };

    if (onlyDeleted || status === "DELETED") {
      where.deletedAt = { not: null };
    } else {
      if (!includeDeleted) {
        where.deletedAt = null;
      }
      if (status && status !== "ALL" && status !== "DELETED") {
        where.status = status;
      } else if (!includeInactive) {
        where.status = "ACTIVE";
      }
    }

    if (search && search.trim() !== "") {
      const trimmedSearch = search.trim();
      where.OR = [
        { name: { contains: trimmedSearch, mode: "insensitive" } },
        { slug: { contains: trimmedSearch, mode: "insensitive" } },
        { description: { contains: trimmedSearch, mode: "insensitive" } },
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
          brand: {
            select: { id: true, name: true, slug: true },
          },
          categories: {
            where: { category: { deletedAt: null } },
            select: {
              categoryId: true,
              sortOrder: true,
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          variants: {
            where: includeInactive ? {} : { deletedAt: null, isActive: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            select: {
              id: true,
              sku: true,
              title: true,
              price: true,
              isDefault: true,
              ...(includeInventory ? { inventory: { select: { quantityOnHand: true, reservedQuantity: true } } } : {}),
            },
          },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            select: { id: true, url: true, isPrimary: true, sortOrder: true },
          },
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
