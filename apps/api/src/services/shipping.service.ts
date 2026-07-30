import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { ShippingRepository } from "../repositories/shipping.repository";

import { AuditService } from "./audit.service";

export class ShippingService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly shippingRepository: ShippingRepository
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllZones() {
    return this.shippingRepository.findAllZones();
  }

  async getZoneById(id: string) {
    const zone = await this.shippingRepository.findZoneById(id);
    if (!zone) throw new AppError(404, "NOT_FOUND", "Shipping zone not found");
    return zone;
  }

  async createZone(data: any, actorUserId: string, context: any) {
    const zone = await this.shippingRepository.createZone(data);

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "ShippingZone",
      entityId: zone.id,
      after: zone as any,
      ...context,
    });

    return zone;
  }

  async updateZone(id: string, data: any, actorUserId: string, context: any) {
    const zone = await this.shippingRepository.findZoneById(id);
    if (!zone) throw new AppError(404, "NOT_FOUND", "Shipping zone not found");

    const updatedZone = await this.shippingRepository.updateZone(id, data);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "ShippingZone",
      entityId: id,
      before: zone as any,
      after: updatedZone as any,
      ...context,
    });

    return updatedZone;
  }

  async deleteZone(id: string, actorUserId: string, context: any) {
    const zone = await this.shippingRepository.findZoneById(id);
    if (!zone) throw new AppError(404, "NOT_FOUND", "Shipping zone not found");

    await this.shippingRepository.deleteZone(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "ShippingZone",
      entityId: id,
      before: zone as any,
      ...context,
    });
  }

  // Method operations
  async createMethod(data: any, actorUserId: string, context: any) {
    const method = await this.shippingRepository.createMethod(data);
    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "ShippingMethod",
      entityId: method.id,
      after: method as any,
      ...context,
    });
    return method;
  }

  // Rate operations
  async createRate(data: any, actorUserId: string, context: any) {
    const rate = await this.shippingRepository.createRate(data);
    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "ShippingRate",
      entityId: rate.id,
      after: rate as any,
      ...context,
    });
    return rate;
  }

}
