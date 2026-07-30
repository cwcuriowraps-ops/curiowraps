import type { PrismaClient } from "@dashboard/database";

export interface SearchFilters {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  status?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "relevance";
}

export class SearchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchProducts(filters: SearchFilters, options: SearchOptions) {
    const { keyword, categoryId, brandId, minPrice, maxPrice, isFeatured, status = "ACTIVE" } = filters;
    const { limit = 20, offset = 0, sortBy = "newest" } = options;

    const where: any = {
      deletedAt: null,
      status,
    };

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (categoryId) {
      where.categories = {
        some: { categoryId },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        },
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price_asc") {
      // Note: Ordering by nested relations requires careful Prisma aggregation or sorting after fetch if complex.
      // We will sort by createdAt for now to keep it standard until we introduce Meilisearch.
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "price_desc") {
      orderBy = { createdAt: "desc" };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
        include: {
          brand: true,
          categories: { include: { category: true } },
          variants: { where: { deletedAt: null, isActive: true }, take: 1, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map((product: any) => ({
        ...product,
        basePrice: product.variants?.[0]?.price ?? null,
      })),
      total,
      limit,
      offset,
    };
  }
}
