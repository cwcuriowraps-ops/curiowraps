import type { Request, Response } from "express";

import type { VariantService } from "../services/variant.service";

export interface VariantControllerDeps {
  variantService: VariantService;
}

export function createVariantController(deps: VariantControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const includeInactive = req.query.includeInactive === "true";
      const productId = req.query.productId as string;
      if (!productId) {
        return res.status(400).json({ success: false, error: { message: "productId is required" } });
      }
      const variants = await deps.variantService.getAllVariants(productId, includeInactive);
      res.json({ success: true, data: { variants } });
    },

    getById: async (req: Request, res: Response) => {
      const variant = await deps.variantService.getVariantById(req.params.id as string);
      res.json({ success: true, data: { variant } });
    },

    create: async (req: Request, res: Response) => {
      const variant = await deps.variantService.createVariant(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { variant } });
    },

    update: async (req: Request, res: Response) => {
      const variant = await deps.variantService.updateVariant(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { variant } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.variantService.deleteVariant(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Variant deleted successfully" } });
    },

    restore: async (req: Request, res: Response) => {
      await deps.variantService.restoreVariant(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Variant restored successfully" } });
    },
  };
}
