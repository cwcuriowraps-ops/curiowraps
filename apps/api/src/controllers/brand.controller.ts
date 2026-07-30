import type { Request, Response } from "express";

import type { BrandService } from "../services/brand.service";

export interface BrandControllerDeps {
  brandService: BrandService;
}

export function createBrandController(deps: BrandControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const includeInactive = req.query.includeInactive === "true";
      const brands = await deps.brandService.getAllBrands(includeInactive);
      res.json({ success: true, data: { brands } });
    },

    getById: async (req: Request, res: Response) => {
      const brand = await deps.brandService.getBrandById(req.params.id as string);
      res.json({ success: true, data: { brand } });
    },
    
    getBySlug: async (req: Request, res: Response) => {
      const brand = await deps.brandService.getBrandBySlug(req.params.slug as string);
      res.json({ success: true, data: { brand } });
    },

    create: async (req: Request, res: Response) => {
      const brand = await deps.brandService.createBrand(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { brand } });
    },

    update: async (req: Request, res: Response) => {
      const brand = await deps.brandService.updateBrand(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { brand } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.brandService.deleteBrand(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Brand deleted successfully" } });
    },

    restore: async (req: Request, res: Response) => {
      await deps.brandService.restoreBrand(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Brand restored successfully" } });
    },
  };
}
