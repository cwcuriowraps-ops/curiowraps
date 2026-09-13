import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { InventoryRepository } from "../repositories/inventory.repository";
import { VariantRepository } from "../repositories/variant.repository";

import { AuditService } from "./audit.service";

export class InventoryService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly inventoryRepository: InventoryRepository,
    private readonly variantRepository: VariantRepository
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getInventory(variantId: string, locationId: string) {
    return this.inventoryRepository.getInventory(variantId, locationId);
  }

  async getAllInventory(options: { page: number; limit: number; search?: string }) {
    return this.inventoryRepository.getAllInventory(options);
  }

  private cachedDefaultLocationId: string | null = null;

  async getDefaultLocationId(tx?: any) {
    if (!tx && this.cachedDefaultLocationId) {
      return this.cachedDefaultLocationId;
    }

    const client = tx ?? this.prisma;
    const location = await client.inventoryLocation.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (!location) {
      throw new AppError(500, "INVENTORY_LOCATION_MISSING", "No active inventory location is configured");
    }

    if (!tx) {
      this.cachedDefaultLocationId = location.id;
    }

    return location.id;
  }

  async adjustInventory(data: any, actorUserId: string, context: any) {
    const variant = await this.variantRepository.findById(data.variantId);
    if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");

    // Perform the adjustment (transactional)
    const inventory = await this.inventoryRepository.adjustInventory(
      data.variantId,
      data.locationId,
      data.quantityChange
    );

    // Record the movement
    await this.inventoryRepository.recordMovement({
      variantId: data.variantId,
      locationId: data.locationId,
      type: data.type,
      quantity: data.quantityChange,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      note: data.note,
      createdByUserId: actorUserId,
    });

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Inventory",
      entityId: inventory.id,
      metadata: { change: data.quantityChange, newTotal: inventory.quantityOnHand },
      ...context,
    });

    return inventory;
  }

  async reserveInventory(variantId: string, locationId: string, quantity: number, tx: any) {
    return this.inventoryRepository.reserveInventory(variantId, locationId, quantity, tx);
  }

  async commitInventory(variantId: string, locationId: string, quantity: number, referenceId: string, tx: any) {
    const inv = await this.inventoryRepository.commitInventory(variantId, locationId, quantity, tx);
    await this.inventoryRepository.recordMovement({
      variantId,
      locationId,
      type: "SALE",
      quantity: -quantity,
      referenceType: "ORDER",
      referenceId,
      note: "Inventory committed after successful payment",
    }, tx);
    return inv;
  }

  async directCommitInventory(variantId: string, locationId: string, quantity: number, referenceId: string, tx: any) {
    const inv = await this.inventoryRepository.directCommitInventory(variantId, locationId, quantity, tx);
    await this.inventoryRepository.recordMovement({
      variantId,
      locationId,
      type: "SALE",
      quantity: -quantity,
      referenceType: "ORDER",
      referenceId,
      note: "Inventory committed directly at checkout",
    }, tx);
    return inv;
  }

  async releaseInventory(variantId: string, locationId: string, quantity: number, referenceId: string, tx: any) {
    const inv = await this.inventoryRepository.releaseInventory(variantId, locationId, quantity, tx);
    return inv;
  }

  async getMovements(variantId: string) {
    return this.inventoryRepository.getMovements(variantId);
  }
}
