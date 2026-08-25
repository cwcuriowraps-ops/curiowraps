import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { CategoryRepository } from "../repositories/category.repository";
import { generateUniqueSlug } from "../utils/slug.utils";

import { AuditService } from "./audit.service";
import { RedisService } from "./redis.service";

export interface CreateCategoryInput {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

const CATEGORIES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedCategories: { key: string; data: any; time: number }[] = [];

function getCachedCategories(key: string) {
  const entry = cachedCategories.find((c) => c.key === key);
  if (entry && Date.now() - entry.time < CATEGORIES_CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedCategories(key: string, data: any) {
  cachedCategories = cachedCategories.filter((c) => c.key !== key);
  cachedCategories.push({ key, data, time: Date.now() });
}

export function invalidateCategoriesMemoryCache() {
  cachedCategories = [];
}

export class CategoryService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly categoryRepository: CategoryRepository,
    private readonly redisService: RedisService
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllCategories(includeInactive = false, isFeatured?: boolean) {
    const cacheKey = `${includeInactive}_${isFeatured}`;
    const cached = getCachedCategories(cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await this.categoryRepository.findAll(includeInactive, isFeatured);
    setCachedCategories(cacheKey, categories);
    return categories;
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");
    return category;
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");
    return category;
  }

  async createCategory(data: CreateCategoryInput, actorUserId: string, context: any) {
    console.log("[Category Create][Service] Entered", { data, actorUserId });
    const sanitizedData = {
      ...data,
      parentId: data.parentId && data.parentId.trim() !== "" ? data.parentId : null,
      imageUrl: data.imageUrl && data.imageUrl.trim() !== "" ? data.imageUrl : null,
    };

    // Auto-generate unique slug (e.g., bouquet -> bouquet-2 -> bouquet-3)
    const baseSlugText = sanitizedData.slug && sanitizedData.slug.trim() !== "" ? sanitizedData.slug : sanitizedData.name;
    const uniqueSlug = await generateUniqueSlug(baseSlugText, (candidate) =>
      this.categoryRepository.isSlugTaken(candidate)
    );
    sanitizedData.slug = uniqueSlug;

    if (sanitizedData.parentId) {
      const parent = await this.categoryRepository.findById(sanitizedData.parentId);
      if (!parent) {
        throw new AppError(400, "BAD_REQUEST", "Parent category not found");
      }
    }

    try {
      const category = await this.categoryRepository.create(sanitizedData as any);

      await this.auditService.logAction({
        actorUserId,
        action: "CREATE",
        entityType: "Category",
        entityId: category.id,
        after: category as any,
        ...context,
      });

      await this.redisService.invalidatePattern(`category:*`);
      await this.redisService.invalidatePattern(`categories:*`);
      invalidateCategoriesMemoryCache();

      return category;
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new AppError(409, "CONFLICT", "A category with this slug already exists.");
      }
      throw error;
    }
  }

  async updateCategory(id: string, data: UpdateCategoryInput, actorUserId: string, context: any) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");

    const sanitizedData: UpdateCategoryInput = {
      ...data,
      ...(data.parentId !== undefined ? { parentId: data.parentId && data.parentId.trim() !== "" ? data.parentId : null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl && data.imageUrl.trim() !== "" ? data.imageUrl : null } : {}),
    };

    if (sanitizedData.slug !== undefined || sanitizedData.name !== undefined) {
      const baseText = sanitizedData.slug && sanitizedData.slug.trim() !== "" ? sanitizedData.slug : (sanitizedData.name || category.name);
      const uniqueSlug = await generateUniqueSlug(baseText, (candidate) =>
        this.categoryRepository.isSlugTaken(candidate, id)
      );
      sanitizedData.slug = uniqueSlug;
    }

    if (sanitizedData.parentId) {
      if (sanitizedData.parentId === id) {
        throw new AppError(400, "BAD_REQUEST", "Category cannot be its own parent");
      }
      const parent = await this.categoryRepository.findById(sanitizedData.parentId);
      if (!parent) {
        throw new AppError(400, "BAD_REQUEST", "Parent category not found");
      }
      
      // Prevent circular trees: check if the new parent is actually a descendant
      let currentParentId = parent.parentId;
      while (currentParentId) {
        if (currentParentId === id) {
          throw new AppError(400, "BAD_REQUEST", "Circular category tree detected");
        }
        const nextParent = await this.categoryRepository.findById(currentParentId);
        currentParentId = nextParent?.parentId || null;
      }
    }

    try {
      const updatedCategory = await this.categoryRepository.update(id, sanitizedData as any);

      await this.auditService.logAction({
        actorUserId,
        action: "UPDATE",
        entityType: "Category",
        entityId: id,
        before: category as any,
        after: updatedCategory as any,
        ...context,
      });

      await this.redisService.invalidatePattern(`category:*`);
      await this.redisService.invalidatePattern(`categories:*`);
      invalidateCategoriesMemoryCache();

      return updatedCategory;
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new AppError(409, "CONFLICT", "A category with this slug already exists.");
      }
      throw error;
    }
  }

  async deleteCategory(id: string, actorUserId: string, context: any) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");

    await this.categoryRepository.softDelete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "Category",
      entityId: id,
      before: category as any,
      ...context,
    });

    await this.redisService.invalidatePattern(`category:*`);
    await this.redisService.invalidatePattern(`categories:*`);
    invalidateCategoriesMemoryCache();
  }

  async restoreCategory(id: string, actorUserId: string, context: any) {
    const category = await this.categoryRepository.findById(id, true);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");
    
    await this.categoryRepository.restore(id);

    await this.auditService.logAction({
      actorUserId,
      action: "ACTIVATE",
      entityType: "Category",
      entityId: id,
      ...context,
    });

    await this.redisService.invalidatePattern(`category:*`);
    await this.redisService.invalidatePattern(`categories:*`);
    invalidateCategoriesMemoryCache();
  }
}
