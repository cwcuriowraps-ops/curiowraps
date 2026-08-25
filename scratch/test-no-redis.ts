import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

// Explicitly simulate Redis being completely unavailable
process.env.REDIS_URL = "";

import { prisma } from "../packages/database/src/client";
import { RedisService } from "../apps/api/src/services/redis.service";
import { CategoryRepository } from "../apps/api/src/repositories/category.repository";
import { CategoryService } from "../apps/api/src/services/category.service";
import { ProductRepository } from "../apps/api/src/repositories/product.repository";
import { BrandRepository } from "../apps/api/src/repositories/brand.repository";
import { ProductService } from "../apps/api/src/services/product.service";
import { CartRepository } from "../apps/api/src/repositories/cart.repository";
import { VariantRepository } from "../apps/api/src/repositories/variant.repository";
import { SettingRepository } from "../apps/api/src/repositories/setting.repository";
import { CartService } from "../apps/api/src/services/cart.service";
import { NotificationService, ConsoleEmailProvider } from "../apps/api/src/services/notification.service";
import { QueueService } from "../apps/api/src/services/queue.service";
import { OrderRepository } from "../apps/api/src/repositories/order.repository";
import { CouponRepository } from "../apps/api/src/repositories/coupon.repository";
import { CouponService } from "../apps/api/src/services/coupon.service";
import { InventoryRepository } from "../apps/api/src/repositories/inventory.repository";
import { InventoryService } from "../apps/api/src/services/inventory.service";
import { OrderService } from "../apps/api/src/services/order.service";

async function run() {
  console.log("=== TESTING SYSTEM WITH REDIS UNAVAILABLE ===");
  const redisService = new RedisService();
  console.log("Redis client is:", redisService.getClient()); // should be null

  const categoryRepo = new CategoryRepository(prisma);
  const categoryService = new CategoryService(prisma, categoryRepo, redisService);

  const productRepo = new ProductRepository(prisma);
  const brandRepo = new BrandRepository(prisma);
  const productService = new ProductService(prisma, productRepo, brandRepo, redisService);

  const cartRepo = new CartRepository(prisma);
  const variantRepo = new VariantRepository(prisma);
  const settingRepo = new SettingRepository(prisma);
  const cartService = new CartService(prisma, cartRepo, variantRepo, settingRepo);

  const notificationService = new NotificationService(new ConsoleEmailProvider());
  const queueService = new QueueService(redisService, notificationService);

  const orderRepo = new OrderRepository(prisma);
  const couponRepo = new CouponRepository(prisma);
  const couponService = new CouponService(prisma, couponRepo);
  const invRepo = new InventoryRepository(prisma);
  const invService = new InventoryService(prisma, invRepo, variantRepo);
  const orderService = new OrderService(prisma, orderRepo, cartService, couponService, invService, queueService);

  // 1. Categories
  const categories = await categoryService.getAllCategories();
  console.log("Categories retrieved without Redis:", categories.length);

  // 2. Products
  const products = await productService.getAllProducts();
  console.log("Products retrieved without Redis:", products.length);

  // 3. Cart + Totals Calculation
  const testUser = await prisma.user.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  if (testUser) {
    const cart = await cartService.getCart(undefined, testUser.id);
    console.log("Cart retrieved without Redis. Subtotal:", cart?.totals?.subtotal, "GrandTotal:", cart?.totals?.grandTotal);

    // 4. Test In-memory settings cache invalidation
    console.log("Testing settings cache invalidation...");
    cartService.invalidateSettingsCache();
    const cartAfterInvalidation = await cartService.getCart(undefined, testUser.id);
    console.log("Cart after settings cache invalidation. Tax:", cartAfterInvalidation?.totals?.tax);
  }

  // 5. Test Email delivery without Redis (synchronous fallback)
  console.log("Testing email fallback without Redis...");
  await queueService.sendEmail("TEST_EMAIL", {
    email: "test@example.com",
    firstName: "Test",
    message: "Verifying synchronous email fallback"
  });
  console.log("Email fallback successful!");

  console.log("ALL TESTS WITHOUT REDIS PASSED!");
  await prisma.$disconnect();
}

run().catch(console.error);
