import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { ProductRepository } from "../repositories/product.repository";
import { VariantRepository } from "../repositories/variant.repository";

import { AuditService } from "./audit.service";


export class VariantService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly variantRepository: VariantRepository,
    private readonly productRepository: ProductRepository
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllVariants(productId: string, includeInactive = false) {
    return this.variantRepository.findAll(productId, includeInactive);
  }

  async getVariantById(id: string) {
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");
    return variant;
  }

  async createVariant(data: any, actorUserId: string, context: any) {
    const product = await this.productRepository.findById(data.productId);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");

    const existingSku = await this.variantRepository.findBySku(data.sku);
    if (existingSku) throw new AppError(400, "BAD_REQUEST", "SKU already exists");

    if (data.barcode) {
      const existingBarcode = await this.variantRepository.findByBarcode(data.barcode);
      if (existingBarcode) throw new AppError(400, "BAD_REQUEST", "Barcode already exists");
    }

    const createData = { ...data, product: { connect: { id: data.productId } } };
    delete createData.productId;

    const variant = await this.variantRepository.create(createData);

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "ProductVariant",
      entityId: variant.id,
      after: variant as any,
      ...context,
    });

    return variant;
  }

  async updateVariant(id: string, data: any, actorUserId: string, context: any) {
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");

    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await this.variantRepository.findBySku(data.sku);
      if (existingSku) throw new AppError(400, "BAD_REQUEST", "SKU already exists");
    }

    if (data.barcode && data.barcode !== variant.barcode) {
      const existingBarcode = await this.variantRepository.findByBarcode(data.barcode);
      if (existingBarcode) throw new AppError(400, "BAD_REQUEST", "Barcode already exists");
    }
    
    // Disconnect product relation since we pass data directly to prisma.
    // Or we map appropriately. We just pass data.
    const updateData = { ...data };
    if (updateData.productId) {
      updateData.product = { connect: { id: updateData.productId } };
      delete updateData.productId;
    }

    const updatedVariant = await this.variantRepository.update(id, updateData);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "ProductVariant",
      entityId: id,
      before: variant as any,
      after: updatedVariant as any,
      ...context,
    });

    return updatedVariant;
  }

  async deleteVariant(id: string, actorUserId: string, context: any) {
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");

    await this.variantRepository.softDelete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "ProductVariant",
      entityId: id,
      before: variant as any,
      ...context,
    });
  }

  async restoreVariant(id: string, actorUserId: string, context: any) {
    const variant = await this.variantRepository.findById(id, true);
    if (!variant) throw new AppError(404, "NOT_FOUND", "Variant not found");
    
    await this.variantRepository.restore(id);

    await this.auditService.logAction({
      actorUserId,
      action: "ACTIVATE",
      entityType: "ProductVariant",
      entityId: id,
      ...context,
    });
  }
}
