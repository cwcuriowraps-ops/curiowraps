import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

// Test with connection limit = 5
const safeUrl = (process.env.DATABASE_URL || "").replace("connection_limit=30", "connection_limit=5");
console.log("Testing with safeUrl:", safeUrl);

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  datasources: {
    db: { url: safeUrl }
  }
});

async function run() {
  await prisma.$connect();
  console.log("Connected successfully");

  const product = await prisma.product.findFirst({
    where: { deletedAt: null, status: "ACTIVE" }
  });
  if (!product) return;
  const productId = product.id;

  console.log("1. Testing Reviews queries (Sequential vs Parallel vs optimized):");
  
  const startRev = performance.now();
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
  const durRev = performance.now() - startRev;
  console.log(`Reviews Promise.all completed in ${durRev.toFixed(2)}ms, found ${total} reviews`);

  console.log("2. Testing Eligibility Query with DELIVERED only (Parallelized):");
  const user = await prisma.user.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  if (user) {
    const startElig = performance.now();
    const [deliveredOrder, existingReview] = await Promise.all([
      prisma.order.findFirst({
        where: {
          userId: user.id,
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
          userId: user.id,
          productId: String(productId),
          deletedAt: null,
        },
      }),
    ]);
    const durElig = performance.now() - startElig;
    console.log(`Eligibility query completed in ${durElig.toFixed(2)}ms! hasPurchased:`, Boolean(deliveredOrder));
  }

  await prisma.$disconnect();
}

run().catch(console.error);
