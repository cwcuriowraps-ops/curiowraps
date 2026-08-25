import type { Request, Response } from "express";

import type { ProductService } from "../services/product.service";

export interface ProductControllerDeps {
  productService: ProductService;
}

export function createProductController(deps: ProductControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const isAdminRoute = Boolean(req.originalUrl?.includes("/admin/") || req.baseUrl?.includes("/admin/"));
      const includeInactive = req.query.includeInactive === "true" || isAdminRoute;
      const includeDeleted = req.query.includeDeleted === "true";
      const onlyDeleted = req.query.onlyDeleted === "true" || req.query.status === "DELETED";
      const statusParam = req.query.status as string | undefined;
      const includeInventory = req.query.includeInventory === "true" || includeInactive;
      const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit as string, 10) || 20));
      const categoryParam = (req.query.category ?? req.query.categoryId ?? req.query.categorySlug) as string | undefined;
      const result = await deps.productService.getProducts({
        includeInactive,
        includeDeleted,
        onlyDeleted,
        status: statusParam,
        page,
        limit,
        search: (req.query.search || req.query.q) as string | undefined,
        categoryId: categoryParam,
        brandId: req.query.brandId as string | undefined,
        brandSlug: (req.query.brand ?? req.query.brandSlug) as string | undefined,
        isFeatured: req.query.featured === "true" ? true : undefined,
        sort: req.query.sort as string | undefined,
        includeInventory,
      });
      res.json({
        success: true,
        data: { products: result.products, total: result.total },
        meta: { total: result.total, page, limit, pages: Math.ceil(result.total / limit) },
      });
    },

    getById: async (req: Request, res: Response) => {
      const product = await deps.productService.getProductById(req.params.id as string);
      res.json({ success: true, data: { product } });
    },
    
    getBySlug: async (req: Request, res: Response) => {
      const product = await deps.productService.getProductBySlug(req.params.slug as string);
      res.json({ success: true, data: { product } });
    },

    create: async (req: Request, res: Response) => {
      const product = await deps.productService.createProduct(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { product } });
    },

    update: async (req: Request, res: Response) => {
      const product = await deps.productService.updateProduct(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { product } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.productService.deleteProduct(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Product deleted successfully" } });
    },

    restore: async (req: Request, res: Response) => {
      await deps.productService.restoreProduct(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Product restored successfully" } });
    },
  };
}
