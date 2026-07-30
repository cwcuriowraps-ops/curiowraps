import type { Request, Response } from "express";

import type { InventoryService } from "../services/inventory.service";

export interface InventoryControllerDeps {
  inventoryService: InventoryService;
}

export function createInventoryController(deps: InventoryControllerDeps) {
  return {
    getInventory: async (req: Request, res: Response) => {
      const { variantId, locationId, page = "1", limit = "20", search } = req.query;
      
      if (variantId && locationId) {
        const inventory = await deps.inventoryService.getInventory(variantId as string, locationId as string);
        return res.json({ success: true, data: { inventory } });
      }

      // Pagination mode (all inventory for dashboard)
      const parsedPage = parseInt(page as string, 10) || 1;
      const parsedLimit = parseInt(limit as string, 10) || 20;

      const { data, total } = await deps.inventoryService.getAllInventory({
        page: parsedPage,
        limit: parsedLimit,
        search: search as string,
      });

      res.json({
        success: true,
        data,
        meta: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      });
    },

    adjustInventory: async (req: Request, res: Response) => {
      const inventory = await deps.inventoryService.adjustInventory(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(200).json({ success: true, data: { inventory } });
    },

    getMovements: async (req: Request, res: Response) => {
      const { variantId } = req.query;
      if (!variantId) {
        return res.status(400).json({ success: false, error: { message: "variantId is required" } });
      }
      const movements = await deps.inventoryService.getMovements(variantId as string);
      res.json({ success: true, data: { movements } });
    },

    getLocations: async (req: Request, res: Response) => {
      const locations = await (deps.inventoryService as any).prisma.inventoryLocation.findMany({
        where: { isActive: true },
      });
      res.json({ success: true, data: { locations } });
    },

    getInventoryStats: async (req: Request, res: Response) => {
      const prisma = (deps.inventoryService as any).prisma;
      
      const totalVariants = await prisma.productVariant.count({ where: { deletedAt: null } });
      
      const outOfStock = await prisma.productVariant.count({
        where: { deletedAt: null, inventory: { some: { quantityOnHand: { lte: 0 } } } },
      });
      
      const lowStock = await prisma.productVariant.count({
        where: { deletedAt: null, inventory: { some: { quantityOnHand: { gt: 0, lte: 10 } } } }, // Threshold hardcoded to 10 for now
      });

      const totalValueRaw = await prisma.$queryRaw`
        SELECT SUM(i."quantityOnHand" * v."price") as value
        FROM "Inventory" i
        JOIN "ProductVariant" v ON i."variantId" = v.id
        WHERE v."deletedAt" IS NULL AND i."quantityOnHand" > 0
      `;

      const totalValue = totalValueRaw?.[0]?.value || 0;

      res.json({
        success: true,
        data: {
          totalVariants,
          outOfStock,
          lowStock,
          totalValue: Number(totalValue),
        },
      });
    },
  };
}
