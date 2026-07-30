import type { Request, Response } from "express";

import type { SearchRepository } from "../repositories/search.repository";

export interface SearchControllerDeps {
  searchRepository: SearchRepository;
}

export function createSearchController(deps: SearchControllerDeps) {
  return {
    search: async (req: Request, res: Response) => {
      const filters = {
        keyword: (req.query.keyword || req.query.q) as string | undefined,
        categoryId: req.query.categoryId as string | undefined,
        brandId: req.query.brandId as string | undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        isFeatured: req.query.isFeatured ? req.query.isFeatured === "true" : undefined,
      };

      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
        sortBy: req.query.sortBy as any,
      };

      const result = await deps.searchRepository.searchProducts(filters, options);
      res.json({ success: true, data: result });
    },
  };
}
