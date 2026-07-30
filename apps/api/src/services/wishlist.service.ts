import { AppError } from "../middleware/error-handler";
import { ProductRepository } from "../repositories/product.repository";
import { WishlistRepository } from "../repositories/wishlist.repository";

import { CartService } from "./cart.service";

export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly productRepository: ProductRepository,
    private readonly cartService: CartService
  ) {}

  async getWishlist(userId: string) {
    return this.wishlistRepository.findByUserId(userId);
  }

  async addItem(userId: string, productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product || product.deletedAt || product.status !== "ACTIVE") {
      throw new AppError(400, "BAD_REQUEST", "Product is not available");
    }

    return this.wishlistRepository.addItem(userId, productId);
  }

  async removeItem(userId: string, productId: string) {
    await this.wishlistRepository.removeItem(userId, productId);
  }

  async clearWishlist(userId: string) {
    await this.wishlistRepository.clearItems(userId);
  }

  async moveToCart(userId: string, productId: string, variantId: string) {
    // 1. Add to cart
    await this.cartService.addItemToCart(variantId, 1, undefined, userId);
    // 2. Remove from wishlist
    await this.removeItem(userId, productId);
  }
}
