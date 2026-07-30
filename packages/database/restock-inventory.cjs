const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Restock all zero-stock items to 50, and reset any stuck reservations
  const updated = await prisma.inventory.updateMany({
    where: { quantityOnHand: { lte: 0 } },
    data: { quantityOnHand: 50, reservedQuantity: 0 },
  });
  console.log(`Restocked ${updated.count} inventory record(s) to 50 units.`);

  // Also free stuck reservations on items where reserved > onHand
  const stuck = await prisma.$executeRaw`
    UPDATE "Inventory"
    SET "reservedQuantity" = 0
    WHERE "reservedQuantity" > "quantityOnHand"
  `;
  console.log(`Fixed ${stuck} stuck reservation(s).`);

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
