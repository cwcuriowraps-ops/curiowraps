import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== CATEGORIES IN DB ===");
  const categories = await prisma.category.findMany();
  console.log(JSON.stringify(categories, null, 2));

  console.log("\n=== PRODUCTS & IMAGES IN DB ===");
  const products = await prisma.product.findMany({
    include: {
      images: true,
      categories: { include: { category: true } }
    }
  });
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status,
    isFeatured: p.isFeatured,
    deletedAt: p.deletedAt,
    images: p.images,
    categories: p.categories.map(c => ({ id: c.category.id, name: c.category.name, slug: c.category.slug, isActive: c.category.isActive }))
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
