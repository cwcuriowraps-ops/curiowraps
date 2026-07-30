import type { Prisma, PrismaClient } from "@dashboard/database";

export class MediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params?.limit) || 24));
    const skip = (page - 1) * limit;

    const where: Prisma.MediaAssetWhereInput = {
      deletedAt: null,
      ...(params?.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { storageKey: { contains: params.search, mode: "insensitive" } },
              { publicUrl: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  async create(data: Prisma.MediaAssetCreateInput) {
    return this.prisma.mediaAsset.create({ data });
  }

  async update(id: string, data: Prisma.MediaAssetUpdateInput) {
    return this.prisma.mediaAsset.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.mediaAsset.delete({ where: { id } });
  }
}
