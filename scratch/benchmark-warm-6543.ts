import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { PrismaClient } from "@prisma/client";

async function run() {
  const url6543 = "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&pgbouncer=true&connection_limit=10&pool_timeout=15";
  const prisma = new PrismaClient({ datasources: { db: { url: url6543 } } });

  console.log("=== WARMING PRISMA ON PORT 6543 (pgBouncer Transaction Mode) ===");
  const t0 = performance.now();
  await prisma.$connect();
  console.log(`Prisma $connect: ${(performance.now() - t0).toFixed(2)}ms`);

  // Warmup query
  const tWarm = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  console.log(`Warmup ping: ${(performance.now() - tWarm).toFixed(2)}ms`);

  // 1. Reviews Query
  const product = await prisma.product.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  if (product) {
    const productId = product.id;
    console.log("\n--- Testing Reviews API query ---");
    const tRev = performance.now();
    const where: any = { isApproved: true, deletedAt: null, productId };
    const [reviews, total, aggregateStats, rawRatingCounts] = await Promise.all([
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
    console.log(`Reviews 4-query Promise.all took: ${(performance.now() - tRev).toFixed(2)}ms`);
  }

  // 2. Eligibility Query (fixed enum: DELIVERED instead of DELIVERED+COMPLETED)
  const user = await prisma.user.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  if (user && product) {
    console.log("\n--- Testing Eligibility Query ---");
    const tElig = performance.now();
    const [deliveredOrder, existingReview] = await Promise.all([
      prisma.order.findFirst({
        where: {
          userId: user.id,
          status: "DELIVERED",
          items: {
            some: {
              productId: String(product.id),
            },
          },
        },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.review.findFirst({
        where: {
          userId: user.id,
          productId: String(product.id),
          deletedAt: null,
        },
      }),
    ]);
    console.log(`Eligibility parallel queries took: ${(performance.now() - tElig).toFixed(2)}ms`);
  }

  // 3. Cart Query (getCart)
  console.log("\n--- Testing Cart Query ---");
  const tCart = performance.now();
  const cart = await prisma.cart.findFirst({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    select: { url: true, isPrimary: true, sortOrder: true },
                    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
                  }
                }
              },
            },
          },
        },
      },
    },
  });
  console.log(`Cart query took: ${(performance.now() - tCart).toFixed(2)}ms`);

  await prisma.$disconnect();
}

run().catch(console.error);
