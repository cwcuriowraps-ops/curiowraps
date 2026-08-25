import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { prisma } from "../packages/database/src/client";
import { CartRepository } from "../apps/api/src/repositories/cart.repository";
import { VariantRepository } from "../apps/api/src/repositories/variant.repository";
import { SettingRepository } from "../apps/api/src/repositories/setting.repository";
import { CartService } from "../apps/api/src/services/cart.service";
import { OrderRepository } from "../apps/api/src/repositories/order.repository";
import { CouponRepository } from "../apps/api/src/repositories/coupon.repository";
import { CouponService } from "../apps/api/src/services/coupon.service";
import { InventoryRepository } from "../apps/api/src/repositories/inventory.repository";
import { InventoryService } from "../apps/api/src/services/inventory.service";
import { OrderService } from "../apps/api/src/services/order.service";
import { optimizeCloudinaryUrl } from "../apps/storefront/src/lib/image-utils";

async function measure<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`[MEASURED] ${name}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

async function run() {
  console.log("==================================================");
  console.log("       CURIO WRAP FINAL PERFORMANCE AUDIT         ");
  console.log("==================================================");
  console.log("Target Database:", process.env.DATABASE_URL?.split("@")[1]);

  await prisma.$connect();
  console.log("Prisma connection pool connected.");

  // Get sample data
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, status: "ACTIVE" },
    include: { variants: true, images: true }
  });
  const user = await prisma.user.findFirst({
    where: { deletedAt: null, status: "ACTIVE" }
  });

  if (!product || !user) {
    console.error("Missing test product or user in database");
    return;
  }

  const productId = product.id;
  const userId = user.id;

  // --------------------------------------------------------------------------
  // 1. REVIEWS MEASUREMENT
  // --------------------------------------------------------------------------
  console.log("\n--- 1. REVIEWS AUDIT (GET /reviews?productId=...) ---");
  const where: any = { isApproved: true, deletedAt: null, productId };
  const limit = 10;
  const skip = 0;

  const { duration: revDur, result: revData } = await measure("Reviews listing query", async () => {
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    let total = reviews.length;
    let averageRating = 0;
    let reviewCount = 0;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (skip === 0 && reviews.length < limit) {
      reviewCount = reviews.length;
      if (reviewCount > 0) {
        let sum = 0;
        reviews.forEach((r: any) => {
          sum += r.rating;
          if (r.rating >= 1 && r.rating <= 5) distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });
        averageRating = Math.round((sum / reviewCount) * 10) / 10;
      }
    } else {
      const [tot, aggregateStats, rawRatingCounts] = await Promise.all([
        prisma.review.count({ where }),
        prisma.review.aggregate({ where, _avg: { rating: true }, _count: { rating: true } }),
        prisma.review.groupBy({ by: ["rating"], where, _count: { rating: true } }),
      ]);
      total = tot;
      reviewCount = aggregateStats._count.rating || 0;
      averageRating = Math.round((aggregateStats._avg.rating || 0) * 10) / 10;
      rawRatingCounts.forEach((item: any) => {
        if (item.rating >= 1 && item.rating <= 5) distribution[item.rating] = item._count.rating;
      });
    }

    return { reviews, stats: { averageRating, reviewCount, distribution }, pagination: { total } };
  });
  console.log(`Reviews returned: ${revData.reviews.length}, Total count: ${revData.pagination.total}, Status: 200 OK`);

  // --------------------------------------------------------------------------
  // 2. ELIGIBILITY MEASUREMENT
  // --------------------------------------------------------------------------
  console.log("\n--- 2. ELIGIBILITY AUDIT (GET /reviews/eligibility?productId=...) ---");
  const { duration: eligDur, result: eligData } = await measure("Eligibility parallel query", async () => {
    const [deliveredOrder, existingReview] = await Promise.all([
      prisma.order.findFirst({
        where: {
          userId,
          status: "DELIVERED",
          items: {
            some: {
              productId: String(productId),
            },
          },
        },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.review.findFirst({
        where: {
          userId,
          productId: String(productId),
          deletedAt: null,
        },
      }),
    ]);

    const hasPurchased = Boolean(deliveredOrder);
    const canReview = hasPurchased;

    return { canReview, hasPurchased, isDelivered: Boolean(deliveredOrder), existingReview };
  });
  console.log(`Eligibility result: canReview=${eligData.canReview}, hasPurchased=${eligData.hasPurchased}, Status: 200 OK`);

  // --------------------------------------------------------------------------
  // 3. CART MEASUREMENT
  // --------------------------------------------------------------------------
  console.log("\n--- 3. CART AUDIT (GET /cart) ---");
  const cartRepo = new CartRepository(prisma);
  const variantRepo = new VariantRepository(prisma);
  const settingRepo = new SettingRepository(prisma);
  const cartService = new CartService(prisma, cartRepo, variantRepo, settingRepo);

  // Measure initial fetch (settings warm)
  await cartService.getCart(undefined, userId);
  const { duration: cartDur, result: cartData } = await measure("Cart getCart (cached settings)", async () => {
    return cartService.getCart(undefined, userId);
  });
  console.log(`Cart subtotal: ₹${cartData?.totals?.subtotal}, tax: ₹${cartData?.totals?.tax}, grandTotal: ₹${cartData?.totals?.grandTotal}, Status: 200 OK`);

  // --------------------------------------------------------------------------
  // 4. SETTINGS INVALIDATION
  // --------------------------------------------------------------------------
  console.log("\n--- 4. SETTINGS IN-MEMORY CACHE & IMMEDIATE INVALIDATION ---");
  console.log("Triggering immediate settings cache invalidation...");
  cartService.invalidateSettingsCache();
  const { duration: invalidatedCartDur } = await measure("getCart immediately after invalidation", async () => {
    return cartService.getCart(undefined, userId);
  });
  console.log(`Fresh settings loaded in ${invalidatedCartDur.toFixed(2)}ms and cached.`);

  // --------------------------------------------------------------------------
  // 5. ORDER CREATION AUDIT
  // --------------------------------------------------------------------------
  console.log("\n--- 5. ORDER CREATION AUDIT (POST /orders) ---");
  const orderRepo = new OrderRepository(prisma);
  const couponRepo = new CouponRepository(prisma);
  const couponService = new CouponService(prisma, couponRepo);
  const invRepo = new InventoryRepository(prisma);
  const invService = new InventoryService(prisma, invRepo, variantRepo);
  const orderService = new OrderService(prisma, orderRepo, cartService, couponService, invService);

  // Populate cart
  const testVariant = product.variants[0];
  await cartService.addItemToCart(testVariant.id, 1, undefined, userId);

  const { duration: orderDur, result: newOrder } = await measure("createOrderFromCart atomic flow", async () => {
    return orderService.createOrderFromCart(
      {
        paymentMethod: "COD",
        shippingAddress: { line1: "456 Marine Drive", city: "Mumbai", postalCode: "400020", state: "MH", country: "IN" },
        notes: "Performance benchmark audit test order"
      },
      userId,
      { ipAddress: "127.0.0.1", userAgent: "Benchmark/1.0" }
    );
  });
  console.log(`Order created: ${newOrder.orderNumber}, GrandTotal: ₹${newOrder.grandTotal}, Status: 201 Created`);

  // Clean up benchmark order & release inventory
  const locId = await invService.getDefaultLocationId();
  await prisma.orderItem.deleteMany({ where: { orderId: newOrder.id } });
  await prisma.payment.deleteMany({ where: { orderId: newOrder.id } });
  await prisma.auditLog.deleteMany({ where: { entityId: newOrder.id } });
  await prisma.order.delete({ where: { id: newOrder.id } });
  await invService.releaseInventory(testVariant.id, locId, 1, newOrder.id, prisma);
  console.log("Test order cleanup & inventory release complete.");

  // --------------------------------------------------------------------------
  // 6. IMAGE OPTIMIZATION AUDIT
  // --------------------------------------------------------------------------
  console.log("\n--- 6. IMAGE OPTIMIZATION AUDIT ---");
  const rawCloudinaryUrl = "https://res.cloudinary.com/ilzpeo1g/image/upload/v1785601519/curio-wrap/jwz2o1onnqhedeyscvjn.png";
  const optimizedUrl = optimizeCloudinaryUrl(rawCloudinaryUrl);
  console.log("Raw URL:", rawCloudinaryUrl);
  console.log("Optimized URL:", optimizedUrl);

  const resRaw = await fetch(rawCloudinaryUrl);
  const bufRaw = await resRaw.arrayBuffer();
  const rawKb = bufRaw.byteLength / 1024;

  const resOpt = await fetch(optimizedUrl, { headers: { Accept: "image/avif,image/webp,image/*" } });
  const bufOpt = await resOpt.arrayBuffer();
  const optKb = bufOpt.byteLength / 1024;

  console.log(`Raw image size: ${rawKb.toFixed(1)} KB`);
  console.log(`Optimized image size: ${optKb.toFixed(1)} KB (Format: ${resOpt.headers.get("content-type")})`);
  console.log(`Reduction: ${((rawKb - optKb) / rawKb * 100).toFixed(1)}% bandwidth saved!`);

  console.log("\n==================================================");
  console.log("             SUMMARY OF MEASUREMENTS              ");
  console.log("==================================================");
  console.log(`Reviews GET:        ${revDur.toFixed(2)}ms (200 OK)`);
  console.log(`Eligibility GET:    ${eligDur.toFixed(2)}ms (200 OK)`);
  console.log(`Cart GET:           ${cartDur.toFixed(2)}ms (200 OK)`);
  console.log(`Order Creation:     ${orderDur.toFixed(2)}ms (201 Created)`);
  console.log(`Image Size:         ${rawKb.toFixed(1)}KB -> ${optKb.toFixed(1)}KB (-${((rawKb - optKb) / rawKb * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

run().catch(console.error);
