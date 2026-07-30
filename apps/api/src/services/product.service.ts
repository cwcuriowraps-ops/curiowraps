import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { BrandRepository } from "../repositories/brand.repository";
import { ProductRepository } from "../repositories/product.repository";

import { AuditService } from "./audit.service";
import { RedisService } from "./redis.service";



export class ProductService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly redisService: RedisService
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllProducts(includeInactive = false) {
    if (!includeInactive) {
      const cached = await this.redisService.get<any[]>("products:all:active");
      if (cached) return cached;
    }
    const products = await this.productRepository.findAll(includeInactive);
    if (!includeInactive) {
      await this.redisService.set("products:all:active", products, 3600);
    }
    return products;
  }

  async getProducts(options: Parameters<ProductRepository["findPage"]>[0]) {
    const result = await this.productRepository.findPage(options);
    return {
      ...result,
      products: result.products.map((product: any) => ({
        ...product,
        basePrice: product.variants?.[0]?.price ?? null,
      })),
    };
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
    return { ...product, basePrice: (product as any).variants?.[0]?.price ?? null };
  }

  async getProductBySlug(slug: string) {
    const cacheKey = `product:slug:${slug}`;
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) return cached;

    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      // Ignore URI decode error and fall back to original slug
    }

    let product = await this.productRepository.findBySlug(slug);
    if (!product && decodedSlug !== slug) {
      product = await this.productRepository.findBySlug(decodedSlug);
    }

    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");

    const result = { ...product, basePrice: (product as any).variants?.[0]?.price ?? null };
    await this.redisService.set(cacheKey, result, 3600);
    return result;
  }

  private generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  async createProduct(data: any, actorUserId: string, context: any) {
    let slug = data.slug && data.slug.trim() !== "" ? this.generateSlug(data.slug) : this.generateSlug(data.name);
    if (!slug) {
      slug = `product-${Date.now()}`;
    }

    // Ensure 100% unique URL-safe slug
    let existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      let counter = 1;
      const baseSlug = slug;
      while (existing) {
        slug = `${baseSlug}-${counter}`;
        existing = await this.productRepository.findBySlug(slug);
        counter++;
      }
    }

    console.info(
      "[CreateProduct][Service][Step:Start]",
      JSON.stringify({ name: data.name, slug, brandId: data.brandId, categoryId: data.categoryId })
    );

    const brandId = data.brandId && data.brandId.trim() !== "" ? data.brandId : null;
    if (brandId) {
      const brand = await this.brandRepository.findById(brandId);
      if (!brand) throw new AppError(400, "BAD_REQUEST", "Invalid Brand ID");
    }

    // Extract non-model or special fields
    const {
      categoryId,
      basePrice,
      categories: rawCategories,
      images: rawImages,
      variants: rawVariants,
      brandId: _bId,
      slug: _s,
      ...restData
    } = data;

    // Build Categories input
    let categoriesCreate: any[] = [];
    if (Array.isArray(rawCategories)) {
      categoriesCreate = rawCategories.map((c: any, i: number) => ({
        categoryId: typeof c === "string" ? c : c.categoryId,
        sortOrder: typeof c === "object" ? c.sortOrder ?? i : i,
      }));
    } else if (rawCategories?.create && Array.isArray(rawCategories.create)) {
      categoriesCreate = rawCategories.create.map((c: any, i: number) => ({
        categoryId: c.categoryId,
        sortOrder: c.sortOrder ?? i,
      }));
    } else if (categoryId && categoryId.trim() !== "") {
      categoriesCreate = [{ categoryId, sortOrder: 0 }];
    }

    // Build Images input
    let imagesCreate: any[] = [];
    if (Array.isArray(rawImages)) {
      imagesCreate = rawImages.map((img: any, i: number) => ({
        url: typeof img === "string" ? img : img.url,
        sortOrder: typeof img === "object" ? img.sortOrder ?? i : i,
        isPrimary: typeof img === "object" ? img.isPrimary ?? (i === 0) : i === 0,
      }));
    } else if (rawImages?.create && Array.isArray(rawImages.create)) {
      imagesCreate = rawImages.create.map((img: any, i: number) => ({
        url: img.url,
        sortOrder: img.sortOrder ?? i,
        isPrimary: img.isPrimary ?? (i === 0),
      }));
    }

    // Build Variants input
    let variantItems: any[] = [];
    if (Array.isArray(rawVariants)) {
      variantItems = rawVariants;
    } else if (rawVariants?.create && Array.isArray(rawVariants.create)) {
      variantItems = rawVariants.create;
    }

    let variantsCreate: any[] = [];
    if (variantItems.length > 0) {
      variantsCreate = variantItems.map((v: any, index: number) => ({
        sku: v.sku || `${slug.toUpperCase()}-${index + 1}`,
        title: v.title || (index === 0 ? "Default" : `Variant ${index + 1}`),
        price: Number(v.price ?? basePrice ?? 0),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        weight: v.weight ? Number(v.weight) : null,
        isDefault: index === 0,
        optionValues: v.optionValues ?? {},
      }));
    } else {
      variantsCreate = [
        {
          sku: `${slug.toUpperCase()}-DEFAULT`,
          title: "Default",
          price: Number(basePrice ?? 0),
          isDefault: true,
          optionValues: {},
        },
      ];
    }

    const createInput: any = {
      ...restData,
      name: data.name,
      slug,
      ...(brandId ? { brand: { connect: { id: brandId } } } : {}),
      ...(categoriesCreate.length > 0 ? { categories: { create: categoriesCreate } } : {}),
      ...(imagesCreate.length > 0 ? { images: { create: imagesCreate } } : {}),
      variants: { create: variantsCreate },
    };

    // Execute atomic creation transaction
    const product = await this.prisma.$transaction(async (tx: any) => {
      const createdProduct = await tx.product.create({
        data: createInput,
        include: {
          brand: true,
          categories: { include: { category: true } },
          variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        },
      });

      const defaultLocation = await tx.inventoryLocation.findFirst({ where: { isActive: true } });
      if (defaultLocation && createdProduct.variants && createdProduct.variants.length > 0) {
        for (const variant of createdProduct.variants) {
          await tx.inventory.create({
            data: {
              variantId: variant.id,
              locationId: defaultLocation.id,
              quantityOnHand: 100,
              reservedQuantity: 0,
              reorderPoint: 5,
            },
          });
        }
      }

      return createdProduct;
    });

    console.info("[CreateProduct][Service][Step:Success]", JSON.stringify({ id: product.id, slug: product.slug }));

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "Product",
      entityId: product.id,
      after: product as any,
      ...context,
    });

    await this.redisService.invalidatePattern(`product:*`);
    await this.redisService.invalidatePattern(`products:*`);

    return product;
  }

  async updateProduct(id: string, data: any, actorUserId: string, context: any) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");

    if (data.slug && data.slug !== product.slug) {
      const existing = await this.productRepository.findBySlug(data.slug);
      if (existing) throw new AppError(400, "BAD_REQUEST", "Product slug already exists");
    }

    const brandId = data.brandId !== undefined ? (data.brandId && data.brandId.trim() !== "" ? data.brandId : null) : undefined;
    if (brandId) {
      const brand = await this.brandRepository.findById(brandId);
      if (!brand) throw new AppError(400, "BAD_REQUEST", "Invalid Brand ID");
    }

    const { categoryId: _c, basePrice: _bp, brandId: _b, ...restData } = data;

    const updateInput: any = {
      ...restData,
      ...(brandId !== undefined ? (brandId ? { brand: { connect: { id: brandId } } } : { brand: { disconnect: true } }) : {}),
    };

    // Safe inventory cleanup if replacing variants
    if (data.variants && data.variants.deleteMany) {
      await this.prisma.inventory.deleteMany({
        where: { variant: { productId: id } },
      });
    }

    const updatedProduct = await this.productRepository.update(id, updateInput);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      before: product as any,
      after: updatedProduct as any,
      ...context,
    });

    await this.redisService.invalidatePattern(`product:*`);
    await this.redisService.invalidatePattern(`products:*`);

    return updatedProduct;
  }

  async deleteProduct(id: string, actorUserId: string, context: any) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");

    await this.productRepository.softDelete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "Product",
      entityId: id,
      before: product as any,
      ...context,
    });

    await this.redisService.invalidatePattern(`product:*`);
    await this.redisService.invalidatePattern(`products:*`);
  }

  async restoreProduct(id: string, actorUserId: string, context: any) {
    const product = await this.productRepository.findById(id, true);
    if (!product) throw new AppError(404, "NOT_FOUND", "Product not found");
    
    await this.productRepository.restore(id);

    await this.auditService.logAction({
      actorUserId,
      action: "ACTIVATE",
      entityType: "Product",
      entityId: id,
      ...context,
    });

    await this.redisService.invalidatePattern(`product:*`);
    await this.redisService.invalidatePattern(`products:*`);
  }
}
