import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { PrismaClient } from "@prisma/client";

async function testPort(port: number, extraParams: string) {
  const base = "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com";
  const url = `${base}:${port}/postgres?sslmode=require&connect_timeout=15&${extraParams}`;
  console.log(`\nTesting Port ${port} with ${extraParams}...`);
  
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const t0 = performance.now();
    await prisma.$connect();
    console.log(`Connected in ${(performance.now() - t0).toFixed(2)}ms`);
    
    const t1 = performance.now();
    const res = await prisma.$queryRaw`SELECT 1 as val`;
    console.log(`Query SELECT 1 in ${(performance.now() - t1).toFixed(2)}ms:`, res);

    const product = await prisma.product.findFirst({ where: { deletedAt: null, status: "ACTIVE" } });
    if (product) {
      const productId = product.id;
      const t2 = performance.now();
      const where: any = { isApproved: true, deletedAt: null, productId };
      const [reviews, total, aggregateStats, rawRatingCounts] = await Promise.all([
        prisma.review.findMany({ where, skip: 0, take: 10 }),
        prisma.review.count({ where }),
        prisma.review.aggregate({ where, _avg: { rating: true }, _count: { rating: true } }),
        prisma.review.groupBy({ by: ["rating"], where, _count: { rating: true } }),
      ]);
      console.log(`Reviews 4 queries in ${(performance.now() - t2).toFixed(2)}ms, found ${total} reviews`);
    }
  } catch (err: any) {
    console.error(`Error on port ${port}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await testPort(6543, "pgbouncer=true&connection_limit=10&pool_timeout=15");
  await testPort(5432, "connection_limit=5&pool_timeout=15");
}

run().catch(console.error);
