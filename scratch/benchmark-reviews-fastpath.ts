import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { PrismaClient } from "@prisma/client";

async function run() {
  const url6543 = "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&pgbouncer=true&connection_limit=10&pool_timeout=15";
  const prisma = new PrismaClient({ datasources: { db: { url: url6543 } } });

  await prisma.$connect();
  const product = await prisma.product.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
  if (!product) return;
  const productId = product.id;

  console.log("=== BENCHMARKING OPTIMIZED REVIEWS FETCH ===");

  // Option A: 4 queries (old)
  const t0 = performance.now();
  const where: any = { isApproved: true, deletedAt: null, productId };
  const [reviewsOld, totalOld, aggregateStatsOld, rawRatingCountsOld] = await Promise.all([
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
  const durOld = performance.now() - t0;
  console.log(`4-query unoptimized took: ${durOld.toFixed(2)}ms`);

  // Option B: Smart fast-path optimized reviews fetch
  const t1 = performance.now();
  const limit = 10;
  const skip = 0;

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
    // We have all reviews in memory! No additional queries needed!
    total = reviews.length;
    reviewCount = reviews.length;
    if (reviewCount > 0) {
      let sum = 0;
      reviews.forEach((r) => {
        sum += r.rating;
        if (r.rating >= 1 && r.rating <= 5) distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      });
      averageRating = Math.round((sum / reviewCount) * 10) / 10;
    }
  } else {
    // Only fetch aggregate and count if there are more reviews than 1 page
    const [tot, aggregateStats, rawRatingCounts] = await Promise.all([
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
    total = tot;
    reviewCount = aggregateStats._count.rating || 0;
    averageRating = Math.round((aggregateStats._avg.rating || 0) * 10) / 10;
    rawRatingCounts.forEach((item: any) => {
      if (item.rating >= 1 && item.rating <= 5) distribution[item.rating] = item._count.rating;
    });
  }

  const durOptimized = performance.now() - t1;
  console.log(`Smart fast-path optimized took: ${durOptimized.toFixed(2)}ms (from ${durOld.toFixed(2)}ms -> ${durOptimized.toFixed(2)}ms, ${((durOld - durOptimized) / durOld * 100).toFixed(1)}% faster!)`);

  await prisma.$disconnect();
}

run().catch(console.error);
