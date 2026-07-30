import type { PrismaClient } from "@dashboard/database";

export class WishlistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async addItem(userId: string, productId: string) {
    return this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
      include: { product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } } } },
    });
  }

  async removeItem(userId: string, productId: string) {
    return this.prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async clearItems(userId: string) {
    return this.prisma.wishlistItem.deleteMany({
      where: { userId },
    });
  }
}
