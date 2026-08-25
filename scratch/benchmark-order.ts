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

async function run() {
  await prisma.$connect();

  const user = await prisma.user.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, status: "ACTIVE" },
    include: { variants: true }
  });
  const variant = product?.variants[0];

  if (!user || !variant) {
    console.log("Missing user or variant to test");
    return;
  }

  console.log("Setting up test dependencies...");
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

  // Setup cart with 1 item
  await cartService.addItemToCart(variant.id, 1, undefined, user.id);
  console.log("Cart populated with 1 item for user:", user.id);

  console.log("=== BENCHMARKING ORDER CREATION ===");
  const t0 = performance.now();
  const order = await orderService.createOrderFromCart(
    {
      paymentMethod: "COD",
      shippingAddress: { line1: "123 Test St", city: "Mumbai", postalCode: "400001", state: "MH", country: "IN" },
    },
    user.id,
    { ipAddress: "127.0.0.1", userAgent: "Benchmark" }
  );
  const dur = performance.now() - t0;
  console.log(`Order created in ${dur.toFixed(2)}ms! Order number: ${order.orderNumber}`);

  // Cleanup the test order
  console.log("Cleaning up test order...");
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.payment.deleteMany({ where: { orderId: order.id } });
  await prisma.auditLog.deleteMany({ where: { entityId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  // Release reserved inventory
  const locId = await invService.getDefaultLocationId();
  await invRepo.releaseInventory(variant.id, locId, 1, order.id, prisma);
  console.log("Cleanup complete");

  await prisma.$disconnect();
}

run().catch(console.error);
