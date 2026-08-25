import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- MediaAssets ---");
  const media = await prisma.mediaAsset.findMany({ take: 10 });
  console.log(media.map(m => ({ id: m.id, publicUrl: m.publicUrl, mimeType: m.mimeType })));

  console.log("\n--- Categories ---");
  const categories = await prisma.category.findMany({ take: 5 });
  console.log(categories.map(c => ({ id: c.id, name: c.name, imageUrl: c.imageUrl })));

  console.log("\n--- ProductImages ---");
  const productImages = await prisma.productImage.findMany({ take: 10 });
  console.log(productImages.map(pi => ({ id: pi.id, url: pi.url, productId: pi.productId })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
