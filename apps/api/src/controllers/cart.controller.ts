import type { Request, Response } from "express";

import type { CartService } from "../services/cart.service";

export interface CartControllerDeps {
  cartService: CartService;
}

export function createCartController(deps: CartControllerDeps) {
  return {
    getCart: async (req: Request, res: Response) => {
      // In a real app, sessionId comes from signed cookies
      const sessionId = req.cookies?.cart_session_id || req.headers["x-session-id"] as string | undefined;
      const userId = req.authUser?.id;
      
      const cart = await deps.cartService.getCart(sessionId, userId);
      if (cart?.sessionId && !userId && cart.sessionId !== sessionId) {
        res.cookie("cart_session_id", cart.sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
      }
      res.json({ success: true, data: { cart } });
    },

    addItem: async (req: Request, res: Response) => {
      const sessionId = req.cookies?.cart_session_id || req.headers["x-session-id"] as string | undefined;
      const userId = req.authUser?.id;
      const { variantId, quantity, customization } = req.body;

      const cart = await deps.cartService.addItemToCart(variantId, quantity, sessionId, userId, customization);
      if (cart?.sessionId && !userId && cart.sessionId !== sessionId) {
        res.cookie("cart_session_id", cart.sessionId, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
      }
      res.json({ success: true, data: { cart } });
    },

    updateItem: async (req: Request, res: Response) => {
      const sessionId = req.cookies?.cart_session_id || req.headers["x-session-id"] as string | undefined;
      const userId = req.authUser?.id;
      const { quantity } = req.body;
      const variantId = req.params.variantId as string;

      const cart = await deps.cartService.updateItemQuantity(variantId, quantity, sessionId, userId);
      res.json({ success: true, data: { cart } });
    },

    removeItem: async (req: Request, res: Response) => {
      const sessionId = req.cookies?.cart_session_id || req.headers["x-session-id"] as string | undefined;
      const userId = req.authUser?.id;
      const variantId = req.params.variantId as string;

      const cart = await deps.cartService.removeItem(variantId, sessionId, userId);
      res.json({ success: true, data: { cart } });
    },

    clearCart: async (req: Request, res: Response) => {
      const sessionId = req.cookies?.cart_session_id || req.headers["x-session-id"] as string | undefined;
      const userId = req.authUser?.id;

      const cart = await deps.cartService.clearCart(sessionId, userId);
      res.json({ success: true, data: { cart } });
    },
    
    mergeCart: async (req: Request, res: Response) => {
      const sessionId = req.cookies?.cart_session_id || req.headers["x-session-id"] as string;
      const userId = req.authUser?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: "Must be logged in to merge cart" } });
      }
      
      if (!sessionId) {
        // Nothing to merge
        return res.json({ success: true, data: { cart: await deps.cartService.getCart(undefined, userId) } });
      }

      const cart = await deps.cartService.mergeCarts(sessionId, userId);
      res.json({ success: true, data: { cart } });
    }
  };
}
