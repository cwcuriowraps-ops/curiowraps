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

const BRANDS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedBrands: { key: string; data: any; time: number }[] = [];

function getCachedBrands(key: string) {
  const entry = cachedBrands.find((b) => b.key === key);
  if (entry && Date.now() - entry.time < BRANDS_CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedBrands(key: string, data: any) {
  cachedBrands = cachedBrands.filter((b) => b.key !== key);
  cachedBrands.push({ key, data, time: Date.now() });
}

export function invalidateBrandsMemoryCache() {
  cachedBrands = [];
}

export class BrandService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly brandRepository: BrandRepository,
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllBrands(includeInactive = false) {
    const cacheKey = String(includeInactive);
    const cached = getCachedBrands(cacheKey);
    if (cached) {
      return cached;
    }

    const brands = await this.brandRepository.findAll(includeInactive);
    setCachedBrands(cacheKey, brands);
    return brands;
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

    invalidateBrandsMemoryCache();

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

    invalidateBrandsMemoryCache();

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

    invalidateBrandsMemoryCache();
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

    invalidateBrandsMemoryCache();
  }
}
