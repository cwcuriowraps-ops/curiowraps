import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { PrismaClient } from "@prisma/client";
const url6543 = "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&pgbouncer=true&connection_limit=10&pool_timeout=15";
const prisma = new PrismaClient({ datasources: { db: { url: url6543 } } });

async function run() {
  await prisma.$connect();
  const product = await prisma.product.findFirst({ where: { deletedAt: null }, include: { variants: true } });
  const variantId = product!.variants[0].id;
  const location = await prisma.inventoryLocation.findFirst({ where: { isActive: true } });
  const locationId = location!.id;

  console.log("=== Testing transaction timing ===");
  const t0 = performance.now();
  await prisma.$transaction(async (tx) => {
    const tTx0 = performance.now();
    // 1. Lock with $queryRaw
    await tx.$queryRaw`SELECT id FROM "Inventory" WHERE "variantId" = ${variantId}::uuid AND "locationId" = ${locationId}::uuid FOR UPDATE`;
    console.log(`Lock took: ${(performance.now() - tTx0).toFixed(2)}ms`);

    const tTx1 = performance.now();
    const inv = await tx.inventory.findUnique({ where: { variantId_locationId: { variantId, locationId } } });
    console.log(`FindUnique took: ${(performance.now() - tTx1).toFixed(2)}ms`);

    const tTx2 = performance.now();
    await tx.inventory.update({
      where: { variantId_locationId: { variantId, locationId } },
      data: { reservedQuantity: { increment: 1 } },
    });
    console.log(`Update took: ${(performance.now() - tTx2).toFixed(2)}ms`);
  }, { maxWait: 10000, timeout: 20000 });
  console.log(`Total transaction time: ${(performance.now() - t0).toFixed(2)}ms`);

  // Release
  await prisma.inventory.update({
    where: { variantId_locationId: { variantId, locationId } },
    data: { reservedQuantity: { decrement: 1 } },
  });

  await prisma.$disconnect();
}

run().catch(console.error);
