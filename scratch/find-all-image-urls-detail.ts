import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING ALL TABLES FOR IMAGE URLS ===");

  const media = await prisma.mediaAsset.findMany();
  console.log(`\nMediaAsset count: ${media.length}`);
  for (const m of media) {
    console.log(`- Media [${m.id}] publicUrl: "${m.publicUrl}"`);
  }

  const categories = await prisma.category.findMany();
  console.log(`\nCategory count: ${categories.length}`);
  for (const c of categories) {
    console.log(`- Category [${c.name}] imageUrl: "${c.imageUrl}"`);
  }

  const productImages = await prisma.productImage.findMany({
    include: { product: { select: { name: true } } }
  });
  console.log(`\nProductImage count: ${productImages.length}`);
  for (const pi of productImages) {
    console.log(`- ProductImage [${pi.product?.name}] url: "${pi.url}"`);
  }

  const brands = await prisma.brand.findMany();
  console.log(`\nBrand count: ${brands.length}`);
  for (const b of brands) {
    console.log(`- Brand [${b.name}] logoUrl: "${b.logoUrl}"`);
  }

  const reviews = await prisma.review.findMany();
  console.log(`\nReview count: ${reviews.length}`);
  for (const r of reviews) {
    if (r.images && (r.images as any).length > 0) {
      console.log(`- Review [${r.id}] images:`, r.images);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
