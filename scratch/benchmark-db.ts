import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { prisma } from "../packages/database/src/client";

async function measure(name: string, fn: () => Promise<any>) {
  const start = performance.now();
  try {
    const res = await fn();
    const duration = performance.now() - start;
    console.log(`[BENCHMARK] ${name}: ${duration.toFixed(2)}ms (SUCCESS)`);
    return { success: true, duration, res };
  } catch (err: any) {
    const duration = performance.now() - start;
    console.log(`[BENCHMARK] ${name}: ${duration.toFixed(2)}ms (FAILED: ${err.message})`);
    return { success: false, duration, error: err };
  }
}

async function run() {
  console.log("=== MEASURING DATABASE & QUERIES ===");
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  // 1. Connection warm up / acquisition
  await measure("DB Warmup ($connect)", async () => {
    await prisma.$connect();
  });

  // 2. Simple Ping
  await measure("DB Ping (SELECT 1)", async () => {
    return prisma.$queryRaw`SELECT 1 as ping`;
  });

  // 3. Find a sample product
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, status: "ACTIVE" },
    include: { variants: true }
  });
  console.log("Found sample product:", product?.id, product?.name);

  if (!product) {
    console.log("No product found to test!");
    return;
  }

  const productId = product.id;

  // 4. Test Reviews Query (as in route /reviews?productId=...)
  await measure("Reviews GET route queries (Promise.all 4 queries)", async () => {
    const where: any = { isApproved: true, deletedAt: null, productId };
    return Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where,
        _count: { rating: true },
      }),
    ]);
  });

  // 5. Test Eligibility Queries (as in route /reviews/eligibility?productId=...)
  // We need a user ID
  const user = await prisma.user.findFirst({
    where: { deletedAt: null, status: "ACTIVE" }
  });
  console.log("Found sample user:", user?.id, user?.email);

  if (user) {
    const userId = user.id;
    await measure("Eligibility Sequential Queries (current code)", async () => {
      const deliveredOrder = await prisma.order.findFirst({
        where: {
          userId,
          status: { in: ["DELIVERED", "COMPLETED"] },
          items: {
            some: {
              productId: String(productId),
            },
          },
        },
        select: { id: true, status: true, createdAt: true },
      });

      const existingReview = await prisma.review.findFirst({
        where: {
          userId,
          productId: String(productId),
          deletedAt: null,
        },
      });
      return { deliveredOrder, existingReview };
    });

    await measure("Eligibility Parallel Queries (Promise.all)", async () => {
      return Promise.all([
        prisma.order.findFirst({
          where: {
            userId,
            status: { in: ["DELIVERED", "COMPLETED"] },
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
    });
  }

  // 6. Test Cart Queries (getCart)
  await measure("Cart findByUserId (Deep include)", async () => {
    return prisma.cart.findFirst({
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } } },
              },
            },
          },
        },
      },
    });
  });

  await measure("Settings fetch (findByKeys)", async () => {
    return prisma.setting.findMany({
      where: { key: { in: ["shipping", "taxes"] } },
    });
  });

  // 7. Inventory check
  await measure("Default Location ID lookup", async () => {
    return prisma.inventoryLocation.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
  });

  await prisma.$disconnect();
}

run().catch(console.error);
