import type { Prisma, PrismaClient } from "@dashboard/database";

export class CartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findBySessionId(sessionId: string) {
    return this.prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } } },
              },
            },
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } } },
              },
            },
          },
        },
      },
    });
  }

  async create(data: any) {
    // Use upsert to atomically create-or-return the cart, preventing race conditions.
    if (data.userId) {
      return this.prisma.cart.upsert({
        where: { userId: data.userId },
        create: { ...data, sessionId: null },
        update: {},
        include: { items: true },
      });
    }
    return this.prisma.cart.upsert({
      where: { sessionId: data.sessionId },
      create: data,
      update: {},
      include: { items: true },
    });
  }

  async update(id: string, data: Prisma.CartUpdateInput) {
    return this.prisma.cart.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async delete(id: string) {
    return this.prisma.cart.delete({ where: { id } });
  }

  // Cart Item Operations
  async addItem(cartId: string, variantId: string, productId: string, quantity: number, unitPrice: any, customization?: string) {
    return this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      update: { 
        quantity: { increment: quantity },
        ...(customization !== undefined ? { customization } : {}),
      },
      create: { 
        cartId, 
        variantId, 
        productId, 
        quantity, 
        unitPrice,
        ...(customization ? { customization } : {}),
      } as any,
    });
  }

  async updateItemQuantity(cartId: string, variantId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { cartId_variantId: { cartId, variantId } },
      data: { quantity },
    });
  }

  async removeItem(cartId: string, variantId: string) {
    return this.prisma.cartItem.delete({
      where: { cartId_variantId: { cartId, variantId } },
    });
  }

  async clearItems(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async clearByUserId(userId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cart: { userId } },
    });
  }

  async clearBySessionId(sessionId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cart: { sessionId } },
    });
  }
}
