import type { Request, Response } from "express";

import type { WishlistService } from "../services/wishlist.service";

export interface WishlistControllerDeps {
  wishlistService: WishlistService;
}

export function createWishlistController(deps: WishlistControllerDeps) {
  return {
    getWishlist: async (req: Request, res: Response) => {
      const items = await deps.wishlistService.getWishlist(req.authUser!.id);
      res.json({ success: true, data: { items } });
    },

    addItem: async (req: Request, res: Response) => {
      const { productId } = req.body;
      const item = await deps.wishlistService.addItem(req.authUser!.id, productId);
      res.status(201).json({ success: true, data: { item } });
    },

    removeItem: async (req: Request, res: Response) => {
      const productId = req.params.productId as string;
      await deps.wishlistService.removeItem(req.authUser!.id, productId);
      res.json({ success: true, data: { message: "Item removed from wishlist" } });
    },

    clearWishlist: async (req: Request, res: Response) => {
      await deps.wishlistService.clearWishlist(req.authUser!.id);
      res.json({ success: true, data: { message: "Wishlist cleared" } });
    },

    moveToCart: async (req: Request, res: Response) => {
      const productId = req.params.productId as string;
      const { variantId } = req.body;
      if (!variantId) {
        return res.status(400).json({ success: false, error: { message: "variantId is required to move to cart" } });
      }
      await deps.wishlistService.moveToCart(req.authUser!.id, productId, variantId);
      res.json({ success: true, data: { message: "Item moved to cart" } });
    },
  };
}
