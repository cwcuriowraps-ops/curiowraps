import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDemoData() {
  console.log("Cleaning all demo data & categories from database...");

  // Delete transactional & user-generated data
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.coupon.deleteMany();

  // Delete product catalog & inventory
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.featuredProduct.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariantAttributeValue.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  // Delete marketing & media assets
  await prisma.banner.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.mediaAsset.deleteMany();

  // Delete non-admin customers
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@curiowrap.com" }
  });

  if (adminUser) {
    await prisma.address.deleteMany({
      where: { userId: { not: adminUser.id } }
    });
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany({
      where: { id: { not: adminUser.id } }
    });
  } else {
    await prisma.address.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  }

  console.log("Database demo cleanup complete!");
}

cleanDemoData()
  .catch((e) => {
    console.error("Failed to clean demo data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
