import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const totalProducts = await prisma.product.count();
  const products = await prisma.product.findMany({
    include: {
      images: true
    }
  });

  console.log(`Total Products: ${totalProducts}`);
  let withImages = 0;
  let withoutImages = 0;

  for (const p of products) {
    if (p.images && p.images.length > 0) {
      withImages++;
    } else {
      withoutImages++;
      console.log(`Product without images: "${p.name}" (${p.id})`);
    }
  }

  console.log(`Products WITH images: ${withImages}`);
  console.log(`Products WITHOUT images: ${withoutImages}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
