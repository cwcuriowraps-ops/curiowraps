/* eslint-disable import/order */
import type { Logger } from "pino";

import type { ApiConfig } from "./config";
import type { SearchRepository } from "./repositories/search.repository";
import type { ContactRepository } from "./repositories/contact.repository";
import type { AdminUserService } from "./services/admin-user.service";
import type { AttributeService } from "./services/attribute.service";
import type { AuthService } from "./services/auth.service";
import type { BrandService } from "./services/brand.service";
import type { CategoryService } from "./services/category.service";
import type { InventoryService } from "./services/inventory.service";
import type { ProductService } from "./services/product.service";
import type { UserService } from "./services/user.service";
import type { VariantService } from "./services/variant.service";
import type { MediaService } from "./services/media.service";
import type { CartService } from "./services/cart.service";
import type { WishlistService } from "./services/wishlist.service";
import type { CouponService } from "./services/coupon.service";
import type { OrderService } from "./services/order.service";
import type { ShippingService } from "./services/shipping.service";
import type { PaymentService } from "./services/payment.service";
import type { RedisService } from "./services/redis.service";
import type { QueueService } from "./services/queue.service";
import type { NotificationService } from "./services/notification.service";
import type { SettingRepository } from "./repositories/setting.repository";

export interface PrismaReadinessClient {
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<unknown>;
}

export interface ApiDependencies {
  config: ApiConfig;
  logger: Logger;
  prisma: any;
  authService: AuthService;
  userService: UserService;
  adminUserService: AdminUserService;
  categoryService: CategoryService;
  brandService: BrandService;
  productService: ProductService;
  variantService: VariantService;
  attributeService: AttributeService;
  inventoryService: InventoryService;
  searchRepository: SearchRepository;
  contactRepository: ContactRepository;
  
  // Milestone 5
  mediaService: MediaService;
  cartService: CartService;
  wishlistService: WishlistService;
  couponService: CouponService;
  orderService: OrderService;
  shippingService: ShippingService;
  paymentService: PaymentService;
  redisService: RedisService;
  queueService: QueueService;
  notificationService: NotificationService;
  settingRepository: SettingRepository;
}