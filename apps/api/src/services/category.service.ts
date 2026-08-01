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
    if (!includeInactive && isFeatured === undefined) {
      const cached = await this.redisService.get<any[]>("categories:all:active");
      if (cached) return cached;
    }
    const categories = await this.categoryRepository.findAll(includeInactive, isFeatured);
    if (!includeInactive && isFeatured === undefined) {
      await this.redisService.set("categories:all:active", categories, 3600);
    }
    return categories;
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");
    return category;
  }

  async getCategoryBySlug(slug: string) {
    const cacheKey = `category:slug:${slug}`;
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) return cached;

    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");

    await this.redisService.set(cacheKey, category, 3600);
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
  }
}
