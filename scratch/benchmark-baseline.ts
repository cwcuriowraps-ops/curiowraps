import { performance } from "perf_hooks";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";
const STOREFRONT_BASE = "http://localhost:3000";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function measureHttp(name: string, url: string, runs = 5): Promise<{ min: number; max: number; avg: number }> {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      await res.text();
      times.push(performance.now() - start);
    } catch (err: any) {
      console.error(`Error requesting ${url}:`, err.message);
    }
  }
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`[HTTP Benchmark] ${name.padEnd(30)} -> Avg: ${avg.toFixed(1)}ms (Min: ${min.toFixed(1)}ms, Max: ${max.toFixed(1)}ms)`);
  return { min, max, avg };
}

async function measureDbQuery(name: string, queryFn: () => Promise<any>, runs = 5): Promise<{ min: number; max: number; avg: number }> {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await queryFn();
    times.push(performance.now() - start);
  }
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`[DB Benchmark]   ${name.padEnd(30)} -> Avg: ${avg.toFixed(1)}ms (Min: ${min.toFixed(1)}ms, Max: ${max.toFixed(1)}ms)`);
  return { min, max, avg };
}

async function main() {
  console.log("\n=======================================================");
  console.log("       STARTING PRODUCTION PERFORMANCE BENCHMARK        ");
  console.log("=======================================================\n");

  // 1. Direct DB Query Benchmarks (Supabase PostgreSQL)
  console.log("--- 1. DATABASE QUERIES (Prisma -> Supabase) ---");
  await measureDbQuery("SELECT 1 (Raw Connection)", () => prisma.$queryRaw`SELECT 1`);
  await measureDbQuery("Product.findMany (Catalog)", () =>
    prisma.product.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      take: 20,
      include: {
        brand: true,
        categories: { include: { category: true } },
        variants: { where: { isActive: true, deletedAt: null } },
        images: true,
      },
    })
  );
  await measureDbQuery("Category.findMany (All)", () =>
    prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      include: { parent: true },
      orderBy: { sortOrder: "asc" },
    })
  );
  await measureDbQuery("Setting.findAll", () => prisma.setting.findMany());
  await measureDbQuery("Banner.findMany (Active)", () =>
    prisma.banner.findMany({
      where: { isActive: true },
    })
  );

  // 2. HTTP API Latency Benchmarks
  console.log("\n--- 2. HTTP API LATENCY (Local -> Express -> Supabase) ---");
  await measureHttp("GET /health", `${API_BASE}/health`);
  await measureHttp("GET /products", `${API_BASE}/products`);
  await measureHttp("GET /products?featured=true", `${API_BASE}/products?featured=true`);
  await measureHttp("GET /categories", `${API_BASE}/categories`);
  await measureHttp("GET /categories?featured=true", `${API_BASE}/categories?featured=true`);
  await measureHttp("GET /settings", `${API_BASE}/settings`);
  await measureHttp("GET /brands", `${API_BASE}/brands`);

  // 3. Frontend Storefront TTFB
  console.log("\n--- 3. FRONTEND STOREFRONT TTFB (Next.js) ---");
  await measureHttp("GET Storefront / (Home)", `${STOREFRONT_BASE}/`);
  await measureHttp("GET Storefront /products", `${STOREFRONT_BASE}/products`);
  await measureHttp("GET Storefront /categories", `${STOREFRONT_BASE}/categories`);

  console.log("\n=======================================================");
  console.log("              BENCHMARK COMPLETED                      ");
  console.log("=======================================================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
