import crypto from "crypto";

import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import type { CartRepository } from "../repositories/cart.repository";
import type { SettingRepository } from "../repositories/setting.repository";
import type { VariantRepository } from "../repositories/variant.repository";

export class CartService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cartRepository: CartRepository,
    private readonly variantRepository: VariantRepository,
    private readonly settingRepository?: SettingRepository
  ) {}

  async getCart(sessionId?: string, userId?: string) {
    let cart = null;
    if (userId) {
      cart = await this.cartRepository.findByUserId(userId);
    } else if (sessionId) {
      cart = await this.cartRepository.findBySessionId(sessionId);
    }

    if (!cart) {
      const newSessionId = sessionId || `sess-${crypto.randomUUID()}`;
      try {
        await this.cartRepository.create({
          sessionId: userId ? undefined : newSessionId,
          userId: userId || null,
        } as any);
      } catch (err: any) {
        // P2002 = unique constraint violation from concurrent requests — cart was already created
        if (err?.code !== "P2002") throw err;
      }
      // Re-fetch regardless of whether create succeeded or raced
      cart = userId
        ? await this.cartRepository.findByUserId(userId)
        : await this.cartRepository.findBySessionId(newSessionId);
    }

    return await this.calculateTotals(cart);
  }

  async mergeCarts(sessionId: string, userId: string) {
    const guestCart = await this.cartRepository.findBySessionId(sessionId);
    const userCart = await this.cartRepository.findByUserId(userId);

    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart(undefined, userId);
    }

    if (!userCart) {
      // Just assign the guest cart to the user
      await this.cartRepository.update(guestCart.id, {
        userId,
        sessionId: null, // Clear sessionId since it's now a user cart
      } as any);
    } else {
      // Merge items from guest cart into user cart
      for (const item of guestCart.items) {
        const existingItem = userCart.items.find(i => i.variantId === item.variantId);
        if (existingItem) {
          await this.cartRepository.updateItemQuantity(userCart.id, item.variantId, existingItem.quantity + item.quantity);
        } else {
          await this.cartRepository.addItem(userCart.id, item.variantId, item.productId, item.quantity, item.unitPrice || item.variant?.price);
        }
      }
      // Delete old guest cart
      await this.cartRepository.delete(guestCart.id);
    }

    return this.getCart(undefined, userId);
  }

  async addItemToCart(variantId: string, quantity: number, sessionId?: string, userId?: string, customization?: string) {
    const variant = await this.variantRepository.findById(variantId);
    if (!variant || variant.deletedAt || !variant.isActive) {
      throw new AppError(400, "BAD_REQUEST", "Variant is not available");
    }

    const cart = await this.getCart(sessionId, userId);
    if (!cart) throw new AppError(500, "INTERNAL_SERVER_ERROR", "Failed to resolve cart");

    await this.cartRepository.addItem(cart.id, variantId, variant.productId, quantity, variant.price, customization);
    // Re-fetch by userId or sessionId from the resolved cart (not the request parameter)
    return this.getCart(cart.userId ? undefined : (cart.sessionId ?? sessionId), cart.userId ?? userId);
  }

  async updateItemQuantity(variantId: string, quantity: number, sessionId?: string, userId?: string) {
    const cart = await this.getCart(sessionId, userId);
    if (!cart) throw new AppError(500, "INTERNAL_SERVER_ERROR", "Failed to resolve cart");

    if (quantity === 0) {
      await this.cartRepository.removeItem(cart.id, variantId);
    } else {
      await this.cartRepository.updateItemQuantity(cart.id, variantId, quantity);
    }

    return this.getCart(cart.sessionId ?? sessionId, cart.userId ?? userId);
  }

  async removeItem(variantId: string, sessionId?: string, userId?: string) {
    const cart = await this.getCart(sessionId, userId);
    if (!cart) throw new AppError(500, "INTERNAL_SERVER_ERROR", "Failed to resolve cart");

    await this.cartRepository.removeItem(cart.id, variantId);
    return this.getCart(cart.sessionId ?? sessionId, cart.userId ?? userId);
  }

  private settingsCache: {
    data: Record<string, any>;
    expiresAt: number;
  } | null = null;

  public invalidateSettingsCache(): void {
    this.settingsCache = null;
  }

  async clearCartDirect(sessionId?: string, userId?: string) {
    if (userId) {
      return this.cartRepository.clearByUserId(userId);
    } else if (sessionId) {
      return this.cartRepository.clearBySessionId(sessionId);
    }
  }

  async clearCart(sessionId?: string, userId?: string) {
    if (userId) {
      await this.cartRepository.clearByUserId(userId);
    } else if (sessionId) {
      await this.cartRepository.clearBySessionId(sessionId);
    }
    return this.getCart(sessionId, userId);
  }

  public async calculateTotals(cart: any) {
    if (!cart) return null;

    let subtotal = 0;
    
    const items = (cart.items || []).map((item: any) => {
      const price = parseFloat(item.variant?.price?.toString() || "0");
      const total = price * item.quantity;
      subtotal += total;
      
      return {
        ...item,
        total,
      };
    });

    // Default dynamic settings
    let baseShippingCharge = 100;
    let freeShippingThreshold = 1000;
    let estimatedDeliveryDays = "3-5 Business Days";
    let shippingEnabled = true;

    let taxPercentage = 18;
    let taxLabel = "GST (18%)";
    let taxEnabled = true;

    if (this.settingRepository) {
      try {
        let settingsMap: Record<string, any>;
        const now = Date.now();

        if (this.settingsCache && now < this.settingsCache.expiresAt) {
          settingsMap = this.settingsCache.data;
        } else {
          const settingsList = await this.settingRepository.findByKeys(["shipping", "taxes"]);
          settingsMap = (settingsList || []).reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
          }, {} as Record<string, any>);
          this.settingsCache = {
            data: settingsMap,
            expiresAt: now + 5 * 60 * 1000, // 5 minute TTL
          };
        }

        if (settingsMap.shipping && typeof settingsMap.shipping === "object") {
          const s = settingsMap.shipping;
          if (s.baseShippingCharge !== undefined) baseShippingCharge = Number(s.baseShippingCharge);
          if (s.freeShippingThreshold !== undefined) freeShippingThreshold = Number(s.freeShippingThreshold);
          if (s.estimatedDeliveryDays) estimatedDeliveryDays = String(s.estimatedDeliveryDays);
          if (s.enabled !== undefined) shippingEnabled = Boolean(s.enabled);
        }

        if (settingsMap.taxes && typeof settingsMap.taxes === "object") {
          const t = settingsMap.taxes;
          if (t.taxPercentage !== undefined) taxPercentage = Number(t.taxPercentage);
          if (t.taxLabel) taxLabel = String(t.taxLabel);
          if (t.enabled !== undefined) taxEnabled = Boolean(t.enabled);
        }
      } catch (err) {
        console.error("[CartService] Error fetching dynamic shipping/tax settings:", err);
      }
    }

    // Calculate dynamic shipping fee
    let shipping = 0;
    if (subtotal > 0 && shippingEnabled) {
      if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
        shipping = 0;
      } else {
        shipping = baseShippingCharge;
      }
    }

    // Calculate dynamic tax amount
    let tax = 0;
    if (subtotal > 0 && taxEnabled && taxPercentage > 0) {
      tax = Math.round((subtotal * (taxPercentage / 100)) * 100) / 100;
    }

    const discount = 0;
    const grandTotal = Math.max(0, subtotal + tax + shipping - discount);

    return {
      ...cart,
      items,
      totals: {
        subtotal,
        tax,
        taxLabel,
        taxPercentage,
        shipping,
        baseShippingCharge,
        freeShippingThreshold,
        estimatedDeliveryDays,
        discount,
        grandTotal,
      },
    };
  }
}
