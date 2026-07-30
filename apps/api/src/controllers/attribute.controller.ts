import type { Request, Response } from "express";

import type { AttributeService } from "../services/attribute.service";

export interface AttributeControllerDeps {
  attributeService: AttributeService;
}

export function createAttributeController(deps: AttributeControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const includeInactive = req.query.includeInactive === "true";
      const attributes = await deps.attributeService.getAllAttributes(includeInactive);
      res.json({ success: true, data: { attributes } });
    },

    getById: async (req: Request, res: Response) => {
      const attribute = await deps.attributeService.getAttributeById(req.params.id as string);
      res.json({ success: true, data: { attribute } });
    },

    create: async (req: Request, res: Response) => {
      const attribute = await deps.attributeService.createAttribute(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { attribute } });
    },

    update: async (req: Request, res: Response) => {
      const attribute = await deps.attributeService.updateAttribute(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { attribute } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.attributeService.deleteAttribute(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Attribute deleted successfully" } });
    },

    addValue: async (req: Request, res: Response) => {
      const value = await deps.attributeService.addAttributeValue(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { value } });
    },

    removeValue: async (req: Request, res: Response) => {
      await deps.attributeService.removeAttributeValue(req.params.id as string, req.params.valueId as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Value removed successfully" } });
    },
  };
}
