const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.$queryRaw`
    SELECT i.id, i."variantId", pv.title as variant, p.name as product,
           i."quantityOnHand"::int, i."reservedQuantity"::int,
           (i."quantityOnHand" - i."reservedQuantity")::int AS available
    FROM "Inventory" i
    JOIN "ProductVariant" pv ON pv.id = i."variantId"
    JOIN "Product" p ON p.id = pv."productId"
    ORDER BY available ASC
    LIMIT 30
  `;
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
