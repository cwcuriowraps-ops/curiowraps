import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const media = await prisma.mediaAsset.findMany();
  const categories = await prisma.category.findMany();
  const productImages = await prisma.productImage.findMany();

  console.log("Total MediaAssets:", media.length);
  const mediaUrls = media.map(m => m.publicUrl);
  console.log("Sample MediaAsset URLs:", mediaUrls.slice(0, 5));
  console.log("Relative MediaAsset URLs count:", mediaUrls.filter(u => u && !u.startsWith("http")).length);

  console.log("\nTotal Categories:", categories.length);
  const catUrls = categories.map(c => c.imageUrl);
  console.log("Sample Category URLs:", catUrls.slice(0, 5));
  console.log("Relative Category URLs count:", catUrls.filter(u => u && !u.startsWith("http")).length);

  console.log("\nTotal ProductImages:", productImages.length);
  const prodUrls = productImages.map(pi => pi.url);
  console.log("Sample ProductImage URLs:", prodUrls.slice(0, 5));
  console.log("Relative ProductImage URLs count:", prodUrls.filter(u => u && !u.startsWith("http")).length);

  // Check if any product has NO images or null/empty images
  const productsWithoutImages = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { id: true, name: true }
  });
  console.log("\nProducts without any ProductImage record:", productsWithoutImages.length);

  // Check unique domains / prefixes in ProductImages
  const domains = new Set(prodUrls.map(u => {
    try { return new URL(u).hostname; } catch { return "relative/invalid"; }
  }));
  console.log("ProductImage domain hosts:", Array.from(domains));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
