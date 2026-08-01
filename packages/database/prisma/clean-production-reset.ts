import { PrismaClient, UserStatus, ShippingMethodType } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Configure Cloudinary if keys exist
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function cleanProductionReset() {
  console.log("=========================================");
  console.log("STARTING CLEAN PRODUCTION INSTALLATION RESET");
  console.log("=========================================");

  // 1. Cloudinary Asset Cleanup
  try {
    const mediaAssets = await prisma.mediaAsset.findMany();
    console.log(`Found ${mediaAssets.length} media records in database.`);

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      console.log("Cleaning up Cloudinary remote assets...");
      for (const asset of mediaAssets) {
        if (asset.storageKey) {
          try {
            await cloudinary.uploader.destroy(asset.storageKey);
            console.log(`Destroyed Cloudinary asset: ${asset.storageKey}`);
          } catch (err) {
            console.warn(`Could not destroy Cloudinary asset ${asset.storageKey}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Media asset audit note:", err);
  }

  // 2. Local Disk Uploads Cleanup
  try {
    const uploadsDir = path.join(__dirname, "../../../apps/api/uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== ".gitkeep" && file !== "test.txt") {
          const filePath = path.join(uploadsDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            console.log(`Deleted local file: ${file}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Local uploads cleanup note:", err);
  }

  // 3. Database Clean Reset
  console.log("Executing database clean reset...");

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

  // Delete contact messages if model exists
  if ("contactMessage" in prisma) {
    await (prisma as any).contactMessage.deleteMany();
  }

  // Delete non-admin customers
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@curiowrap.com" },
  });

  if (adminUser) {
    await prisma.address.deleteMany({
      where: { userId: { not: adminUser.id } },
    });
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany({
      where: { id: { not: adminUser.id } },
    });
  } else {
    await prisma.address.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  }

  console.log("Database records purged successfully.");

  // 4. Ensure System Infrastructure & Primary Admin Exist
  console.log("Ensuring System Roles, Settings, Warehouse Location & Admin Account...");

  // Roles
  let adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: "ADMIN", description: "Administrative access.", isSystem: true },
    });
  }

  let customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
  if (!customerRole) {
    customerRole = await prisma.role.create({
      data: { name: "CUSTOMER", description: "Default customer role.", isSystem: true },
    });
  }

  // Permissions
  const permissionCodes = [
    "manage:products", "manage:categories", "manage:brands", "manage:orders",
    "manage:users", "manage:shipping", "manage:settings", "manage:cms",
    "manage:roles", "catalog.read", "catalog.write", "orders.read",
    "orders.write", "cms.write", "inventory.write", "analytics.read"
  ];

  for (const code of permissionCodes) {
    let perm = await prisma.permission.findUnique({ where: { code } });
    if (!perm) {
      perm = await prisma.permission.create({
        data: { code, description: code.replace(".", " ") },
      });
    }

    if (code !== "catalog.read") {
      const existingRP = await prisma.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      });
      if (!existingRP) {
        await prisma.rolePermission.create({
          data: { roleId: adminRole.id, permissionId: perm.id },
        });
      }
    }
  }

  // Primary Admin User
  const PASSWORD_HASH = "$2b$12$LLhtXANbr7HC1R7haCtnGO0kbnDbMjXJuwNUpje0dFHllHnXY285W"; // Admin@123
  let existingAdminUser = await prisma.user.findUnique({ where: { email: "admin@curiowrap.com" } });
  if (!existingAdminUser) {
    existingAdminUser = await prisma.user.create({
      data: {
        email: "admin@curiowrap.com",
        passwordHash: PASSWORD_HASH,
        firstName: "Admin",
        lastName: "Curio",
        roleId: adminRole.id,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        adminProfile: {
          create: { employeeCode: "ADM-001" },
        },
      },
    });
  }

  // Location
  let location = await prisma.inventoryLocation.findUnique({ where: { code: "WH-MAIN-01" } });
  if (!location) {
    location = await prisma.inventoryLocation.create({
      data: {
        code: "WH-MAIN-01",
        name: "Main Warehouse",
        type: "WAREHOUSE",
        city: "Mumbai",
        state: "MH",
        country: "IN",
        isActive: true,
      },
    });
  }

  // Shipping
  const existingZones = await prisma.shippingZone.count();
  if (existingZones === 0) {
    const zone = await prisma.shippingZone.create({
      data: { name: "India", countryCodes: ["IN"], isActive: true, sortOrder: 1 },
    });

    const standardShipping = await prisma.shippingMethod.create({
      data: {
        code: "standard",
        name: "Standard Delivery",
        type: ShippingMethodType.STANDARD,
        provider: "Internal",
        isActive: true,
        handlingTimeHours: 24,
      },
    });

    await prisma.shippingRate.create({
      data: {
        shippingZoneId: zone.id,
        shippingMethodId: standardShipping.id,
        baseRate: 150,
        minOrderAmount: 0,
        maxOrderAmount: 999999,
      },
    });
  }

  // Settings
  const existingSettings = await prisma.setting.count();
  if (existingSettings === 0) {
    await prisma.setting.create({
      data: { key: "storefront.theme", value: { defaultMode: "system", rememberChoice: true }, scope: "storefront" },
    });
    await prisma.setting.create({
      data: { key: "checkout.currency", value: { currency: "INR", symbol: "₹" }, scope: "global" },
    });
  }

  // CMS Pages
  const existingCms = await prisma.cmsPage.count();
  if (existingCms === 0) {
    const cmsPages = [
      {
        slug: "about",
        title: "About Us",
        content: "<div class='prose prose-pink mx-auto'><h2>Our Story</h2><p>Curio Wrap started with a simple vision: crafting smiles, one pipe cleaner at a time.</p></div>",
      },
      {
        slug: "privacy",
        title: "Privacy Policy",
        content: "<div class='prose prose-pink mx-auto'><p>Your privacy matters to us.</p></div>",
      },
      {
        slug: "terms",
        title: "Terms of Service",
        content: "<div class='prose prose-pink mx-auto'><p>By shopping with Curio Wrap, you agree to these terms.</p></div>",
      },
      {
        slug: "contact",
        title: "Contact Us",
        content: "<div class='prose prose-pink mx-auto'><p>Email us at hello@curiowrap.com for custom orders.</p></div>",
      },
    ];

    for (const page of cmsPages) {
      await prisma.cmsPage.create({
        data: {
          slug: page.slug,
          title: page.title,
          content: page.content,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }
  }

  console.log("=========================================");
  console.log("CLEAN PRODUCTION INSTALLATION COMPLETE");
  console.log("=========================================");
}

cleanProductionReset()
  .catch((e) => {
    console.error("Clean production reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
