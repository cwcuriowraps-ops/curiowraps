import type { Request, Response } from "express";

import type { CategoryService } from "../services/category.service";

export interface CategoryControllerDeps {
  categoryService: CategoryService;
}

export function createCategoryController(deps: CategoryControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      // Admins can see inactive ones, public cannot. Let's rely on route middleware to pass a flag or just separate them.
      // But for now, we'll extract includeInactive from query if it's an admin route.
      const includeInactive = req.query.includeInactive === "true";
      const isFeatured = req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined;
      const categories = await deps.categoryService.getAllCategories(includeInactive, isFeatured);
      res.json({ success: true, data: { categories } });
    },

    getById: async (req: Request, res: Response) => {
      const category = await deps.categoryService.getCategoryById(req.params.id as string);
      res.json({ success: true, data: { category } });
    },
    
    getBySlug: async (req: Request, res: Response) => {
      const category = await deps.categoryService.getCategoryBySlug(req.params.slug as string);
      res.json({ success: true, data: { category } });
    },

    create: async (req: Request, res: Response) => {
      console.log("[Category Create][Controller] Entered", { body: req.body, actorUserId: req.authUser?.id });
      try {
        console.log("[Category Create][Controller] Before service await");
        const category = await deps.categoryService.createCategory(req.body, req.authUser!.id, {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
        console.log("[Category Create][Controller] After service await", { categoryId: category.id });
        res.status(201).json({ success: true, data: { category } });
        console.log("[Category Create][Controller] API response sent", { status: 201, categoryId: category.id });
      } catch (error) {
        console.error("[Category Create][Controller] Exception", error);
        console.error("[Category Create][Controller] Stack", error instanceof Error ? error.stack : error);
        throw error;
      }
    },

    update: async (req: Request, res: Response) => {
      const category = await deps.categoryService.updateCategory(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { category } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.categoryService.deleteCategory(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Category deleted successfully" } });
    },

    restore: async (req: Request, res: Response) => {
      await deps.categoryService.restoreCategory(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Category restored successfully" } });
    },
  };
}
