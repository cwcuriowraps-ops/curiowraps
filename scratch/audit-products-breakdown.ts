import { prisma } from "@dashboard/database";
import { signJwt, createTokenId, verifyJwt } from "../apps/api/src/lib/jwt";
import { UserRepository } from "../apps/api/src/repositories/user.repository";
import { ProductRepository } from "../apps/api/src/repositories/product.repository";
import { ContactRepository } from "../apps/api/src/repositories/contact.repository";

async function runDetailedAudit() {
  console.log("================================================================================");
  console.log("  CURIO WRAP ADMIN PRODUCTS & UNREAD-COUNT DEEP LATENCY AUDIT");
  console.log("================================================================================\n");

  const JWT_SECRET = "d7357d704eab4c79c5d29b0fff9b08bc882ef99d3d47aa40efc2cd12e44ea91e";
  const userRepo = new UserRepository(prisma);
  const productRepo = new ProductRepository(prisma);
  const contactRepo = new ContactRepository(prisma);

  const admin = await prisma.user.findFirst({
    where: { role: { name: { in: ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"] } } },
    select: { id: true, email: true, role: { select: { name: true } } },
  });

  if (!admin) throw new Error("No admin found");

  const adminToken = signJwt(
    {
      sub: admin.id,
      userId: admin.id,
      email: admin.email,
      role: admin.role.name,
      jti: createTokenId(),
      tokenType: "access",
    },
    JWT_SECRET,
    "15m"
  );

  // 1. Connection Acquisition
  const t0 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const tConn = performance.now() - t0;
  console.log(`[1] DB Connection Ping (Raw round-trip to Supabase Sydney pooler): ${tConn.toFixed(1)}ms`);

  // 2. Auth Middleware Breakdown
  console.log("\n--- [2] Auth Middleware Inspection ---");
  const tJwt0 = performance.now();
  const payload = verifyJwt<any>(adminToken, JWT_SECRET);
  const tJwt = performance.now() - tJwt0;
  console.log(`  2.1 JWT Verification (in-memory crypto): ${tJwt.toFixed(3)}ms`);

  const tUserDb0 = performance.now();
  const authUser = await userRepo.findById(payload.userId);
  const tUserDb = performance.now() - tUserDb0;
  console.log(`  2.2 findById DB lookup (with 3-level role+permissions include): ${tUserDb.toFixed(1)}ms`);

  // Compare with cached / lightweight auth check
  const tUserDbLean0 = performance.now();
  const authUserLean = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      status: true,
      deletedAt: true,
      role: { select: { name: true } },
    },
  });
  const tUserDbLean = performance.now() - tUserDbLean0;
  console.log(`  2.3 Lean findUnique (id, status, role): ${tUserDbLean.toFixed(1)}ms`);

  // 3. Products Endpoint Query Breakdown
  console.log("\n--- [3] Products Query Breakdown ---");
  const where: any = { deletedAt: null };

  const tFindMany0 = performance.now();
  const products = await prisma.product.findMany({
    where,
    skip: 0,
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { id: true, name: true, slug: true } },
      categories: {
        where: { category: { deletedAt: null } },
        select: { categoryId: true, sortOrder: true, category: { select: { id: true, name: true, slug: true } } },
      },
      variants: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          sku: true,
          title: true,
          price: true,
          isDefault: true,
          inventory: { select: { quantityOnHand: true, reservedQuantity: true } },
        },
      },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { id: true, url: true, isPrimary: true, sortOrder: true },
      },
    },
  });
  const tFindMany = performance.now() - tFindMany0;
  console.log(`  3.1 product.findMany (10 items + 4 relation selects): ${tFindMany.toFixed(1)}ms (Rows: ${products.length})`);

  const tCount0 = performance.now();
  const count = await prisma.product.count({ where });
  const tCount = performance.now() - tCount0;
  console.log(`  3.2 product.count ({ deletedAt: null }): ${tCount.toFixed(1)}ms (Total: ${count})`);

  const tParallel0 = performance.now();
  await Promise.all([
    prisma.product.findMany({ where, skip: 0, take: 10, select: { id: true, name: true, slug: true } }),
    prisma.product.count({ where }),
  ]);
  const tParallel = performance.now() - tParallel0;
  console.log(`  3.3 Promise.all(findMany + count): ${tParallel.toFixed(1)}ms`);

  // 4. Unread-Count Breakdown
  console.log("\n--- [4] Unread-Count Query Breakdown ---");
  const tUnreadDb0 = performance.now();
  const unreadCount = await contactRepo.countUnread();
  const tUnreadDb = performance.now() - tUnreadDb0;
  console.log(`  4.1 contactMessage.count({ status: 'UNREAD' }): ${tUnreadDb.toFixed(1)}ms (Count: ${unreadCount})`);

  // 5. Live HTTP Endpoint Tests (Cold vs Warm vs Concurrent)
  console.log("\n--- [5] Live HTTP Measurements (via http://localhost:4000) ---");

  const headers = { Authorization: `Bearer ${adminToken}` };

  async function fetchProducts() {
    const t = performance.now();
    const res = await fetch("http://localhost:4000/api/v1/admin/products?page=1&limit=10", { headers });
    const dur = performance.now() - t;
    const json = await res.json();
    return { dur, status: res.status, count: json.data?.products?.length };
  }

  async function fetchUnreadCount() {
    const t = performance.now();
    const res = await fetch("http://localhost:4000/api/v1/admin/contact-messages/unread-count", { headers });
    const dur = performance.now() - t;
    const json = await res.json();
    return { dur, status: res.status, unread: json.data?.unreadCount };
  }

  console.log("Running Cold (Request 1)...");
  const p1 = await fetchProducts();
  const u1 = await fetchUnreadCount();

  console.log("Running Warm (Request 2)...");
  const p2 = await fetchProducts();
  const u2 = await fetchUnreadCount();

  console.log("Running Warm (Request 3)...");
  const p3 = await fetchProducts();
  const u3 = await fetchUnreadCount();

  console.log("Running Concurrent (Products + Unread-Count together)...");
  const tConc0 = performance.now();
  const [pConc, uConc] = await Promise.all([fetchProducts(), fetchUnreadCount()]);
  const tConcTotal = performance.now() - tConc0;

  console.log("\n================================================================================");
  console.log("  MEASUREMENT SUMMARY TABLE");
  console.log("================================================================================");
  console.log("| Request | Request 1 (Cold) | Request 2 (Warm) | Request 3 (Warm) | Concurrent |");
  console.log("|---|---:|---:|---:|---:|");
  console.log(`| /admin/products?page=1&limit=10 | ${p1.dur.toFixed(1)}ms | ${p2.dur.toFixed(1)}ms | ${p3.dur.toFixed(1)}ms | ${pConc.dur.toFixed(1)}ms |`);
  console.log(`| /admin/contact-messages/unread-count | ${u1.dur.toFixed(1)}ms | ${u2.dur.toFixed(1)}ms | ${u3.dur.toFixed(1)}ms | ${uConc.dur.toFixed(1)}ms |`);
  console.log(`| Concurrent Total Time | - | - | - | ${tConcTotal.toFixed(1)}ms |`);

  await prisma.$disconnect();
}

runDetailedAudit().catch(console.error);
