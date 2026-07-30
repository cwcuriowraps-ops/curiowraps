import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { AttributeRepository } from "../repositories/attribute.repository";

import { AuditService } from "./audit.service";

export class AttributeService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly attributeRepository: AttributeRepository
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllAttributes(includeInactive = false) {
    return this.attributeRepository.findAll(includeInactive);
  }

  async getAttributeById(id: string) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) throw new AppError(404, "NOT_FOUND", "Attribute not found");
    return attribute;
  }

  async createAttribute(data: any, actorUserId: string, context: any) {
    const existing = await this.attributeRepository.findBySlug(data.slug);
    if (existing) throw new AppError(400, "BAD_REQUEST", "Attribute slug already exists");

    const attribute = await this.attributeRepository.create(data);

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "Attribute",
      entityId: attribute.id,
      after: attribute as any,
      ...context,
    });

    return attribute;
  }

  async updateAttribute(id: string, data: any, actorUserId: string, context: any) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) throw new AppError(404, "NOT_FOUND", "Attribute not found");

    if (data.slug && data.slug !== attribute.slug) {
      const existing = await this.attributeRepository.findBySlug(data.slug);
      if (existing) throw new AppError(400, "BAD_REQUEST", "Attribute slug already exists");
    }

    const updatedAttribute = await this.attributeRepository.update(id, data);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Attribute",
      entityId: id,
      before: attribute as any,
      after: updatedAttribute as any,
      ...context,
    });

    return updatedAttribute;
  }

  async deleteAttribute(id: string, actorUserId: string, context: any) {
    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) throw new AppError(404, "NOT_FOUND", "Attribute not found");

    await this.attributeRepository.delete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "Attribute",
      entityId: id,
      before: attribute as any,
      ...context,
    });
  }

  async addAttributeValue(attributeId: string, data: any, actorUserId: string, context: any) {
    const attribute = await this.attributeRepository.findById(attributeId);
    if (!attribute) throw new AppError(404, "NOT_FOUND", "Attribute not found");

    if (attribute.values.some(v => v.value === data.value)) {
      throw new AppError(400, "BAD_REQUEST", "Value already exists for this attribute");
    }

    const value = await this.attributeRepository.addValue(attributeId, data);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Attribute",
      entityId: attributeId,
      metadata: { addedValue: value.id, valueString: value.value },
      ...context,
    });

    return value;
  }

  async removeAttributeValue(attributeId: string, valueId: string, actorUserId: string, context: any) {
    const attribute = await this.attributeRepository.findById(attributeId);
    if (!attribute) throw new AppError(404, "NOT_FOUND", "Attribute not found");
    
    if (!attribute.values.some(v => v.id === valueId)) {
      throw new AppError(404, "NOT_FOUND", "Value not found on this attribute");
    }

    await this.attributeRepository.removeValue(valueId);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Attribute",
      entityId: attributeId,
      metadata: { removedValue: valueId },
      ...context,
    });
  }
}
