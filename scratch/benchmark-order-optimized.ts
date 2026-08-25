import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { PrismaClient } from "@prisma/client";

// Port 6543 with pgbouncer=true
const url6543 = "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&pgbouncer=true&connection_limit=10&pool_timeout=15";
const prisma = new PrismaClient({ datasources: { db: { url: url6543 } } });

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

async function run() {
  await prisma.$connect();

  const user = await prisma.user.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, status: "ACTIVE" },
    include: { variants: true }
  });
  const variant = product?.variants[0];

  if (!user || !variant) return;

  const cartRepo = new CartRepository(prisma);
  const variantRepo = new VariantRepository(prisma);
  const settingRepo = new SettingRepository(prisma);
  const cartService = new CartService(prisma, cartRepo, variantRepo, settingRepo);
  const orderRepo = new OrderRepository(prisma);
  const couponRepo = new CouponRepository(prisma);
  const couponService = new CouponService(prisma, couponRepo);
  const invRepo = new InventoryRepository(prisma);
  const invService = new InventoryService(prisma, invRepo, variantRepo);
  const orderService = new OrderService(prisma, orderRepo, cartService, couponService, invService);

  // Preload / cache location id
  let cachedLocationId: string | null = null;
  const getLocationId = async () => {
    if (!cachedLocationId) {
      cachedLocationId = await invService.getDefaultLocationId();
    }
    return cachedLocationId;
  };
  await getLocationId();

  // Add item to cart
  await cartService.addItemToCart(variant.id, 1, undefined, user.id);

  console.log("=== BENCHMARKING OPTIMIZED ORDER CREATION (on port 6543 with direct clear) ===");
  const t0 = performance.now();
  
  // 1. Resolve Cart
  const cart = await cartService.getCart(undefined, user.id);
  const cartTotals = cart!.totals;
  const cartItems = cart!.items;

  // 2. Build order data
  const orderItems = cartItems.map((item: any) => ({
    variantId: item.variant.id,
    productId: item.variant.product.id,
    sku: item.variant.sku,
    productName: item.variant.product.name,
    variantName: item.variant.title,
    unitPrice: item.variant.price,
    quantity: item.quantity,
    totalPrice: parseFloat(item.variant.price.toString()) * item.quantity,
    customization: item.customization || null,
    productSnapshot: {
      name: item.variant.product.name,
      slug: item.variant.product.slug,
    },
    variantSnapshot: {
      sku: item.variant.sku,
      title: item.variant.title,
      optionValues: item.variant.optionValues,
    },
  }));

  const orderData = {
    user: { connect: { id: user.id } },
    orderNumber: `CW-TEST-${Date.now()}`,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    subtotal: cartTotals.subtotal,
    taxTotal: cartTotals.tax,
    shippingTotal: cartTotals.shipping,
    discountTotal: 0,
    grandTotal: cartTotals.grandTotal,
    currency: "INR",
    shippingAddressSnapshot: { line1: "123 Test St", city: "Mumbai" },
    billingAddressSnapshot: { line1: "123 Test St", city: "Mumbai" },
    items: { create: orderItems },
    payments: {
      create: [{
        provider: "COD",
        amount: cartTotals.grandTotal,
        currency: "INR",
        status: "PENDING",
      }],
    },
  };

  const locId = await getLocationId();

  // 3. Atomic Order + Inventory reservation in transaction with proper timeout
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({ data: orderData as any, include: { items: true } });
    for (const item of cartItems) {
      await invService.reserveInventory(item.variant.id, locId, item.quantity, tx);
    }
    return newOrder;
  }, { maxWait: 10000, timeout: 20000 });

  // 4. Direct clear cart (1 single fast query, NO double getCart refetches)
  await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });

  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Order",
      entityId: order.id,
      after: { orderNumber: order.orderNumber, status: order.status },
    }
  });

  const dur = performance.now() - t0;
  console.log(`Optimized order created in ${dur.toFixed(2)}ms! Order number: ${order.orderNumber}`);

  // Cleanup
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.payment.deleteMany({ where: { orderId: order.id } });
  await prisma.auditLog.deleteMany({ where: { entityId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await invRepo.releaseInventory(variant.id, locId, 1, order.id, prisma);
  console.log("Cleanup complete!");

  await prisma.$disconnect();
}

run().catch(console.error);
