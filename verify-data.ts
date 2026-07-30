import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting verification...\n");
  
  const productCount = await prisma.product.count();
  console.log(`Products: ${productCount} (Expected: 35)`);
  
  const catCount = await prisma.category.count({ where: { isFeatured: false } });
  console.log(`Categories: ${catCount} (Expected: 8)`);
  
  const collCount = await prisma.category.count({ where: { isFeatured: true } });
  console.log(`Collections (Featured Categories): ${collCount} (Expected: 6)`);
  
  const orderCount = await prisma.order.count();
  console.log(`Orders: ${orderCount} (Expected: 25)`);
  
  const reviewCount = await prisma.review.count();
  console.log(`Reviews: ${reviewCount} (Expected: ~40)`);
  
  const inventoryCount = await prisma.inventory.count();
  console.log(`Inventory Items: ${inventoryCount} (Expected: 35)`);
  
  const userCount = await prisma.user.count({ where: { role: { name: "CUSTOMER" } } });
  console.log(`Customers: ${userCount} (Expected: 20)`);
  
  const mediaCount = await prisma.mediaAsset.count();
  console.log(`Media Assets: ${mediaCount} (Expected: > 50)`);

  // Check some variants
  const variants = await prisma.productVariant.findMany({ take: 3, include: { product: true, inventory: true } });
  console.log("\nSample Variants:");
  for (const v of variants) {
    console.log(`- ${v.product.name} | SKU: ${v.sku} | Price: ${v.price} | Stock: ${v.inventory[0]?.quantityOnHand}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
