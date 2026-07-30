import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { BrandRepository } from "../repositories/brand.repository";

import { AuditService } from "./audit.service";

export interface CreateBrandInput {
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive?: boolean;
}

export interface UpdateBrandInput extends Partial<CreateBrandInput> {}

export class BrandService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly brandRepository: BrandRepository,
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllBrands(includeInactive = false) {
    return this.brandRepository.findAll(includeInactive);
  }

  async getBrandById(id: string) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) throw new AppError(404, "NOT_FOUND", "Brand not found");
    return brand;
  }

  async getBrandBySlug(slug: string) {
    const brand = await this.brandRepository.findBySlug(slug);
    if (!brand) throw new AppError(404, "NOT_FOUND", "Brand not found");
    return brand;
  }

  async createBrand(data: CreateBrandInput, actorUserId: string, context: any) {
    const existingSlug = await this.brandRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw new AppError(400, "BAD_REQUEST", "Brand slug already exists");
    }

    const existingName = await this.brandRepository.findByName(data.name);
    if (existingName) {
      throw new AppError(400, "BAD_REQUEST", "Brand name already exists");
    }

    const brand = await this.brandRepository.create(data);

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "Brand",
      entityId: brand.id,
      after: brand as any,
      ...context,
    });

    return brand;
  }

  async updateBrand(id: string, data: UpdateBrandInput, actorUserId: string, context: any) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) throw new AppError(404, "NOT_FOUND", "Brand not found");

    if (data.slug && data.slug !== brand.slug) {
      const existing = await this.brandRepository.findBySlug(data.slug);
      if (existing) {
        throw new AppError(400, "BAD_REQUEST", "Brand slug already exists");
      }
    }

    if (data.name && data.name !== brand.name) {
      const existing = await this.brandRepository.findByName(data.name);
      if (existing) {
        throw new AppError(400, "BAD_REQUEST", "Brand name already exists");
      }
    }

    const updatedBrand = await this.brandRepository.update(id, data);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Brand",
      entityId: id,
      before: brand as any,
      after: updatedBrand as any,
      ...context,
    });

    return updatedBrand;
  }

  async deleteBrand(id: string, actorUserId: string, context: any) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) throw new AppError(404, "NOT_FOUND", "Brand not found");

    await this.brandRepository.softDelete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "Brand",
      entityId: id,
      before: brand as any,
      ...context,
    });
  }

  async restoreBrand(id: string, actorUserId: string, context: any) {
    const brand = await this.brandRepository.findById(id, true);
    if (!brand) throw new AppError(404, "NOT_FOUND", "Brand not found");
    
    await this.brandRepository.restore(id);

    await this.auditService.logAction({
      actorUserId,
      action: "ACTIVATE",
      entityType: "Brand",
      entityId: id,
      ...context,
    });
  }
}
