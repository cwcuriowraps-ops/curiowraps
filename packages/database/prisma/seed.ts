import { PrismaClient, UserStatus, ShippingMethodType } from "@prisma/client";

const prisma = new PrismaClient();
const PASSWORD_HASH = "$2b$12$LLhtXANbr7HC1R7haCtnGO0kbnDbMjXJuwNUpje0dFHllHnXY285W"; // Admin@123

async function main() {
  console.log("Seeding Production System Infrastructure...");

  // 1. Roles & Permissions
  console.log("Seeding Roles & Permissions...");
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

  // 2. Admin User
  console.log("Seeding Admin User (admin@curiowrap.com)...");
  let adminUser = await prisma.user.findUnique({ where: { email: "admin@curiowrap.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
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

  // 3. Settings & Locations
  console.log("Seeding Settings & Inventory Location...");
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

  const existingSettings = await prisma.setting.count();
  if (existingSettings === 0) {
    await prisma.setting.create({
      data: { key: "storefront.theme", value: { defaultMode: "system", rememberChoice: true }, scope: "storefront" },
    });
    await prisma.setting.create({
      data: { key: "checkout.currency", value: { currency: "INR", symbol: "₹" }, scope: "global" },
    });
  }

  // 4. CMS Pages
  console.log("Seeding CMS Pages...");
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

  console.log("=== PRODUCTION SYSTEM SEEDING COMPLETE ===");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });