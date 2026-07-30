import type { Prisma, PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";

export class InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getInventory(variantId: string, locationId: string) {
    return this.prisma.inventory.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });
  }

  async getAllInventory(options: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: "insensitive" } },
              { product: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [variants, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: true,
          inventory: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    const data = variants.map((v) => {
      const totalInventory = v.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0);
      const totalReserved = v.inventory.reduce((sum, inv) => sum + inv.reservedQuantity, 0);
      return {
        id: v.id,
        name: v.title || v.sku,
        sku: v.sku,
        product: v.product,
        inventory: totalInventory,
        reservedInventory: totalReserved,
      };
    });

    return { data, total };
  }

  /**
   * Used for admin manual stock adjustments
   */
  async adjustInventory(variantId: string, locationId: string, quantityChange: number) {
    return this.prisma.$transaction(async (tx: any) => {
      // Row level lock
      await tx.$queryRaw`SELECT id FROM "Inventory" WHERE "variantId" = ${variantId}::uuid AND "locationId" = ${locationId}::uuid FOR UPDATE`;
      
      let inventory = await tx.inventory.findUnique({
        where: { variantId_locationId: { variantId, locationId } },
      });

      if (!inventory) {
        if (quantityChange < 0) {
          throw new AppError(400, "BAD_REQUEST", "Cannot deduct inventory below zero");
        }
        inventory = await tx.inventory.create({
          data: { variantId, locationId, quantityOnHand: quantityChange },
        });
      } else {
        if (inventory.quantityOnHand + quantityChange < 0) {
          throw new AppError(400, "BAD_REQUEST", "Cannot deduct inventory below zero");
        }
        inventory = await tx.inventory.update({
          where: { variantId_locationId: { variantId, locationId } },
          data: { quantityOnHand: { increment: quantityChange } },
        });
      }
      return inventory;
    });
  }

  /**
   * Reserves inventory during checkout, ensuring overselling is prevented.
   */
  async reserveInventory(variantId: string, locationId: string, quantityToReserve: number, tx: any) {
    // Lock row
    await tx.$executeRaw`SELECT id FROM "Inventory" WHERE "variantId" = ${variantId}::uuid AND "locationId" = ${locationId}::uuid FOR UPDATE`;

    const inventory = await tx.inventory.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });

    if (!inventory) {
      throw new AppError(400, "BAD_REQUEST", `Product is out of stock (No inventory record)`);
    }

    const available = inventory.quantityOnHand - inventory.reservedQuantity;
    if (available < quantityToReserve) {
      throw new AppError(400, "BAD_REQUEST", `Product is out of stock (Available: ${available}, Requested: ${quantityToReserve})`);
    }

    return tx.inventory.update({
      where: { variantId_locationId: { variantId, locationId } },
      data: { reservedQuantity: { increment: quantityToReserve } },
    });
  }

  /**
   * Commits the reserved inventory (deducts from both quantityOnHand and reservedQuantity).
   */
  async commitInventory(variantId: string, locationId: string, quantityToCommit: number, tx: any) {
    // Lock row
    await tx.$executeRaw`SELECT id FROM "Inventory" WHERE "variantId" = ${variantId}::uuid AND "locationId" = ${locationId}::uuid FOR UPDATE`;

    return tx.inventory.update({
      where: { variantId_locationId: { variantId, locationId } },
      data: {
        quantityOnHand: { decrement: quantityToCommit },
        reservedQuantity: { decrement: quantityToCommit },
      },
    });
  }

  /**
   * Releases previously reserved inventory back to the available pool.
   */
  async releaseInventory(variantId: string, locationId: string, quantityToRelease: number, tx: any) {
    // Lock row
    await tx.$executeRaw`SELECT id FROM "Inventory" WHERE "variantId" = ${variantId}::uuid AND "locationId" = ${locationId}::uuid FOR UPDATE`;

    const inventory = await tx.inventory.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
    });

    if (inventory && inventory.reservedQuantity >= quantityToRelease) {
      return tx.inventory.update({
        where: { variantId_locationId: { variantId, locationId } },
        data: { reservedQuantity: { decrement: quantityToRelease } },
      });
    }
  }

  async recordMovement(data: Prisma.InventoryMovementUncheckedCreateInput, tx?: any) {
    const client = tx || this.prisma;
    return client.inventoryMovement.create({ data });
  }

  async getMovements(variantId: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: "desc" },
    });
  }
}
