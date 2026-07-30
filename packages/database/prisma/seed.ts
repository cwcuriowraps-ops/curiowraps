import { PrismaClient, UserRole, UserStatus, ProductStatus, MediaType, CmsPageStatus, NotificationChannel, ShippingMethodType, BannerPlacement, DiscountStrategy, PaymentMethod, OrderStatus, PaymentStatus, InventoryMovementType } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
const PASSWORD_HASH = "$2b$12$LLhtXANbr7HC1R7haCtnGO0kbnDbMjXJuwNUpje0dFHllHnXY285W"; // Admin@123

async function cleanDb() {
  console.log("Cleaning database...");
  await prisma.shippingRate.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.inventoryLocation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariantAttributeValue.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.featuredProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  console.log("Database cleaned.");
}

async function main() {
  await cleanDb();

  console.log("Seeding Roles & Permissions...");
  const adminRole = await prisma.role.create({ data: { name: "ADMIN", description: "Administrative access.", isSystem: true } });
  const customerRole = await prisma.role.create({ data: { name: "CUSTOMER", description: "Default customer role.", isSystem: true } });
  
  const permissionCodes = ["manage:products", "manage:categories", "manage:brands", "manage:orders", "manage:users", "manage:shipping", "manage:settings", "manage:cms", "manage:roles", "catalog.read", "catalog.write", "orders.read", "orders.write", "cms.write", "inventory.write", "analytics.read"];
  for (const code of permissionCodes) {
    const perm = await prisma.permission.create({ data: { code, description: code.replace(".", " ") } });
    if (code !== "catalog.read") {
      await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: perm.id } });
    }
  }

  console.log("Seeding Settings & Locations...");
  const location = await prisma.inventoryLocation.create({
    data: { code: "WH-MAIN-01", name: "Main Warehouse", type: "WAREHOUSE", city: "Mumbai", state: "MH", country: "IN", isActive: true },
  });
  const zone = await prisma.shippingZone.create({
    data: { name: "India", countryCodes: ["IN"], isActive: true, sortOrder: 1 },
  });
  const standardShipping = await prisma.shippingMethod.create({
    data: { code: "standard", name: "Standard Delivery", type: ShippingMethodType.STANDARD, provider: "Internal", isActive: true, handlingTimeHours: 24 },
  });
  await prisma.shippingRate.create({
    data: { shippingZoneId: zone.id, shippingMethodId: standardShipping.id, baseRate: 150, minOrderAmount: 0, maxOrderAmount: 999999 },
  });
  await prisma.setting.create({ data: { key: "storefront.theme", value: { defaultMode: "system", rememberChoice: true }, scope: "storefront" } });
  await prisma.setting.create({ data: { key: "checkout.currency", value: { currency: "INR", symbol: "₹" }, scope: "global" } });

  console.log("Seeding Media Library...");
  const catImages = {
    "Bouquets": "https://images.unsplash.com/photo-1591886960571-74d43a9d4166?q=80&w=800&auto=format&fit=crop",
    "Flowers": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800&auto=format&fit=crop",
    "Animals": "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?q=80&w=800&auto=format&fit=crop",
    "Keychains": "https://images.unsplash.com/photo-1627932371900-58c0cdaea0db?q=80&w=800&auto=format&fit=crop",
    "Home Decor": "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    "Gift Boxes": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
    "Seasonal": "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=800&auto=format&fit=crop",
    "Custom": "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop",
  };
  
  const collImages = {
    "Best Sellers": "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=800&auto=format&fit=crop",
    "New Arrivals": "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=800&auto=format&fit=crop",
    "Trending": "https://images.unsplash.com/photo-1515248137880-45e105b710e0?q=80&w=800&auto=format&fit=crop",
    "Birthday": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800&auto=format&fit=crop",
    "Anniversary": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
    "Premium": "https://images.unsplash.com/photo-1600868884976-13a8f1766627?q=80&w=800&auto=format&fit=crop",
  };

  const productImagesPool = [
    "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513885065363-3eb86f78082a?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1489659357007-889098fbab58?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519098901909-b1553a1190af?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616788225575-d142d547f877?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1606555198083-d34eec3c7336?q=80&w=800&auto=format&fit=crop"
  ];

  const mediaCache = new Map<string, any>();
  async function createMedia(url: string, prefix: string) {
    if (mediaCache.has(url)) {
      return mediaCache.get(url);
    }
    const media = await prisma.mediaAsset.create({
      data: {
        checksum: `seed-${prefix}-${faker.string.uuid()}`,
        storageKey: `seed/${prefix}-${faker.string.alphanumeric(8)}.jpg`,
        publicUrl: url,
        mimeType: "image/jpeg",
        sizeInBytes: 150000,
        type: MediaType.IMAGE,
        altText: `Image for ${prefix}`,
        title: `Asset ${prefix}`,
      }
    });
    mediaCache.set(url, media);
    return media;
  }

  console.log("Seeding Categories...");
  const categories = [];
  let i = 1;
  for (const [name, url] of Object.entries(catImages)) {
    const media = await createMedia(url, `cat-${name.toLowerCase().replace(/\\s+/g, '')}`);
    const c = await prisma.category.create({
      data: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, description: `Explore our gorgeous ${name} crafted from premium pipe cleaners.`, imageUrl: url, sortOrder: i++, isActive: true, isFeatured: false },
    });
    categories.push(c);
  }

  console.log("Seeding Collections (as Featured Categories)...");
  const collections = [];
  for (const [name, url] of Object.entries(collImages)) {
    const media = await createMedia(url, `coll-${name.toLowerCase().replace(/\\s+/g, '')}`);
    const c = await prisma.category.create({
      data: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, description: `Discover our exclusive ${name} collection. Handcrafted perfection.`, imageUrl: url, sortOrder: i++, isActive: true, isFeatured: true },
    });
    collections.push(c);
  }

  console.log("Seeding 35+ Products...");
  const productDataList = [
    { name: "Classic Red Rose Bouquet", cat: "Bouquets", coll: "Best Sellers", price: 1500, stock: 45 },
    { name: "Pastel Tulip Bundle", cat: "Bouquets", coll: "New Arrivals", price: 1800, stock: 30 },
    { name: "Sunshine Sunflower Pot", cat: "Flowers", coll: "Trending", price: 850, stock: 20 },
    { name: "Lavender Dream Wrap", cat: "Bouquets", coll: "Premium", price: 2500, stock: 15 },
    { name: "Mini Daisy Desk Decor", cat: "Home Decor", coll: "Best Sellers", price: 600, stock: 50 },
    { name: "Crochet Style Bear", cat: "Animals", coll: "Trending", price: 1200, stock: 25 },
    { name: "Fluffy Bunny Rabbit", cat: "Animals", coll: "Birthday", price: 1100, stock: 40 },
    { name: "Cute Puppy Keychain", cat: "Keychains", coll: "New Arrivals", price: 350, stock: 100 },
    { name: "Lucky Cat Charm", cat: "Keychains", coll: "Trending", price: 300, stock: 85 },
    { name: "Pink Peony Single Stem", cat: "Flowers", coll: "Best Sellers", price: 400, stock: 120 },
    { name: "Anniversary Special Rose Box", cat: "Gift Boxes", coll: "Anniversary", price: 3500, stock: 10 },
    { name: "Birthday Surprise Box", cat: "Gift Boxes", coll: "Birthday", price: 2800, stock: 20 },
    { name: "Valentine Heart Bouquet", cat: "Seasonal", coll: "Premium", price: 3000, stock: 5 },
    { name: "Halloween Pumpkin Decor", cat: "Seasonal", coll: "Trending", price: 750, stock: 15 },
    { name: "Custom Name Initials", cat: "Custom", coll: "Best Sellers", price: 900, stock: 60 },
    { name: "Custom Portrait Pet", cat: "Custom", coll: "Premium", price: 4500, stock: 8 },
    { name: "Rainbow Cloud Wall Hanging", cat: "Home Decor", coll: "New Arrivals", price: 1600, stock: 22 },
    { name: "Blue Hydrangea Pot", cat: "Flowers", coll: "Trending", price: 1050, stock: 35 },
    { name: "Lilac Sweetheart Bouquet", cat: "Bouquets", coll: "Anniversary", price: 2200, stock: 18 },
    { name: "Frog Prince Keychain", cat: "Keychains", coll: "Birthday", price: 450, stock: 50 },
    { name: "Majestic Swan Figurine", cat: "Animals", coll: "Premium", price: 2100, stock: 12 },
    { name: "Mini Succulent Garden", cat: "Home Decor", coll: "New Arrivals", price: 1400, stock: 28 },
    { name: "Christmas Tree Desk Ornament", cat: "Seasonal", coll: "Trending", price: 950, stock: 45 },
    { name: "Personalized Letter Box", cat: "Custom", coll: "Best Sellers", price: 1800, stock: 30 },
    { name: "Golden Lily Branch", cat: "Flowers", coll: "Premium", price: 800, stock: 60 },
    { name: "Panda Bear Plushie", cat: "Animals", coll: "Best Sellers", price: 1350, stock: 35 },
    { name: "Cherry Blossom Arrangement", cat: "Bouquets", coll: "New Arrivals", price: 2800, stock: 14 },
    { name: "Strawberry Keychain", cat: "Keychains", coll: "Trending", price: 250, stock: 150 },
    { name: "Sunflower & Rose Mix", cat: "Bouquets", coll: "Anniversary", price: 2400, stock: 20 },
    { name: "Luxury Black Box Set", cat: "Gift Boxes", coll: "Premium", price: 4000, stock: 8 },
    { name: "Cozy Fox Miniature", cat: "Animals", coll: "Trending", price: 950, stock: 40 },
    { name: "Winter Snowflake Ornament", cat: "Seasonal", coll: "New Arrivals", price: 450, stock: 65 },
    { name: "Minimalist Fern Leaf", cat: "Home Decor", coll: "Best Sellers", price: 550, stock: 70 },
    { name: "Bespoke Bridal Bouquet", cat: "Custom", coll: "Premium", price: 5000, stock: 5 },
    { name: "Giant Rose Display", cat: "Home Decor", coll: "Anniversary", price: 3200, stock: 10 }
  ];

  const dbProducts = [];
  for (let idx = 0; idx < productDataList.length; idx++) {
    const pData = productDataList[idx];
    const category = categories.find(c => c.name === pData.cat) || categories[0];
    const collection = collections.find(c => c.name === pData.coll) || collections[0];
    
    // Pick 2-4 random images
    const numImages = faker.number.int({ min: 2, max: 4 });
    const productImages = [];
    for (let j = 0; j < numImages; j++) {
      const url = productImagesPool[Math.floor(Math.random() * productImagesPool.length)];
      const media = await createMedia(url, `prod-${idx}-${j}`);
      productImages.push({ mediaAssetId: media.id, url: media.publicUrl, isPrimary: j === 0, sortOrder: j + 1 });
    }
    
    const slug = pData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + faker.string.alphanumeric(4);
    
    const p = await prisma.product.create({
      data: {
        slug,
        name: pData.name,
        subtitle: `Handcrafted ${pData.name} made of premium pipe cleaners.`,
        description: `Experience the finest craftsmanship with our ${pData.name}. Every piece is carefully twisted and shaped by hand using high-quality pipe cleaners to ensure longevity and a luxurious, fuzzy texture. Perfect for gifting or brightening up your personal space!\n\n${faker.lorem.paragraphs(2)}`,
        shortDescription: faker.lorem.sentence(),
        status: ProductStatus.ACTIVE,
        isFeatured: faker.datatype.boolean(0.3),
        tags: ["handmade", "pipecleaner", category.name.toLowerCase().replace(/\\s+/g, '-'), pData.coll.toLowerCase().replace(/\\s+/g, '-')],
        categories: { create: [{ categoryId: category.id }, { categoryId: collection.id }] },
        images: { create: productImages },
        variants: {
          create: [{
            sku: `CW-${slug.substring(0, 8).toUpperCase()}-${faker.string.alphanumeric(4).toUpperCase()}`,
            title: "Standard",
            optionValues: { size: "Standard" },
            price: pData.price,
            compareAtPrice: Math.floor(pData.price * 1.2),
            costPrice: Math.floor(pData.price * 0.4),
            isDefault: true,
            isActive: true,
            inventory: { create: [{ locationId: location.id, quantityOnHand: pData.stock }] }
          }]
        }
      },
      include: { variants: true }
    });
    dbProducts.push(p);
  }

  console.log("Seeding Admins & 20 Customers...");
  const users = [];
  await prisma.user.create({
    data: {
      email: "admin@curiowrap.com", passwordHash: PASSWORD_HASH, firstName: "Admin", lastName: "Curio", roleId: adminRole.id, status: UserStatus.ACTIVE, emailVerifiedAt: new Date(),
      adminProfile: { create: { employeeCode: "ADM-001" } }
    }
  });

  for (let idx = 0; idx < 20; idx++) {
    const u = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        passwordHash: PASSWORD_HASH,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phone: faker.phone.number(),
        roleId: customerRole.id,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        addresses: {
          create: [{
            recipientName: faker.person.fullName(), phone: faker.phone.number(), line1: faker.location.streetAddress(), city: faker.location.city(), state: faker.location.state(), postalCode: faker.location.zipCode(), country: "IN", isDefaultShipping: true, isDefaultBilling: true
          }]
        }
      },
      include: { addresses: true }
    });
    users.push(u);
  }

  console.log("Seeding 3 Coupons...");
  await prisma.coupon.create({ data: { code: `WELCOME10`, description: `Get 10% off your first order`, type: DiscountStrategy.PERCENTAGE, value: 10, minOrderAmount: 500, isActive: true } });
  await prisma.coupon.create({ data: { code: `FREESHIP`, description: `Free Shipping`, type: DiscountStrategy.FIXED, value: 150, minOrderAmount: 1500, isActive: true } });
  await prisma.coupon.create({ data: { code: `FESTIVE20`, description: `Get 20% off during festivals`, type: DiscountStrategy.PERCENTAGE, value: 20, minOrderAmount: 2000, isActive: true } });

  console.log("Seeding 25 Orders...");
  const orderStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED];
  
  for (let idx = 0; idx < 25; idx++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const numItems = faker.number.int({ min: 1, max: 4 });
    const orderItemsData = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const prod = dbProducts[Math.floor(Math.random() * dbProducts.length)];
      const variant = prod.variants[0];
      const qty = faker.number.int({ min: 1, max: 3 });
      const price = Number(variant.price);
      subtotal += price * qty;
      orderItemsData.push({
        productId: prod.id,
        variantId: variant.id,
        productName: prod.name,
        variantName: variant.title,
        sku: variant.sku,
        quantity: qty,
        unitPrice: price,
        totalPrice: price * qty,
      });
    }

    const shippingTotal = subtotal > 1500 ? 0 : 150;
    const taxTotal = subtotal * 0.18;
    const grandTotal = subtotal + shippingTotal + taxTotal;
    
    // Bias towards delivered/shipped to populate realistic dashboard
    const status = faker.helpers.arrayElement([OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING, OrderStatus.PENDING, OrderStatus.CANCELLED]);
    const paymentStatus = (status === OrderStatus.PENDING || status === OrderStatus.CANCELLED) ? PaymentStatus.PENDING : PaymentStatus.PAID;
    
    const placedDate = faker.date.recent({ days: 45 }); // Spread orders over 45 days

    await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${idx}`,
        userId: user.id,
        status: status,
        paymentStatus: paymentStatus,
        paymentMethod: faker.helpers.arrayElement([PaymentMethod.RAZORPAY, PaymentMethod.COD]),
        subtotal,
        shippingTotal,
        taxTotal,
        grandTotal,
        shippingAddressId: user.addresses[0].id,
        billingAddressId: user.addresses[0].id,
        placedAt: placedDate,
        createdAt: placedDate,
        updatedAt: placedDate,
        items: { create: orderItemsData }
      }
    });
  }

  console.log("Seeding 40 Reviews...");
  for (let idx = 0; idx < 40; idx++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const prod = dbProducts[Math.floor(Math.random() * dbProducts.length)];
    try {
      await prisma.review.create({
        data: {
          userId: user.id,
          productId: prod.id,
          rating: faker.number.int({ min: 3, max: 5 }), 
          title: faker.lorem.words({ min: 2, max: 5 }),
          body: faker.lorem.sentences({ min: 1, max: 3 }),
          isApproved: true,
          createdAt: faker.date.recent({ days: 30 })
        }
      });
    } catch (err) {
      // Ignore if user already reviewed this product
    }
  }

  console.log("Seeding CMS Pages and Homepage...");
  await prisma.cmsPage.createMany({
    data: [
      { slug: "about", title: "About Us", content: "<div class='prose prose-pink mx-auto'><h2>Our Story</h2><p>Curio Wrap started with a simple vision: crafting smiles, one pipe cleaner at a time.</p></div>", status: CmsPageStatus.PUBLISHED, publishedAt: new Date() },
      { slug: "privacy", title: "Privacy Policy", content: "<div class='prose prose-pink mx-auto'><p>Your privacy matters to us.</p></div>", status: CmsPageStatus.PUBLISHED, publishedAt: new Date() },
      { slug: "terms", title: "Terms of Service", content: "<div class='prose prose-pink mx-auto'><p>By shopping with Curio Wrap, you agree to these terms.</p></div>", status: CmsPageStatus.PUBLISHED, publishedAt: new Date() },
      { slug: "contact", title: "Contact Us", content: "<div class='prose prose-pink mx-auto'><p>Email us at hello@curiowrap.com for custom orders.</p></div>", status: CmsPageStatus.PUBLISHED, publishedAt: new Date() }
    ]
  });

  const heroMedia = await createMedia("https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200&auto=format&fit=crop", "hero-banner");
  await prisma.banner.create({
    data: {
      title: "Discover Curio Wrap Creations",
      subtitle: "Cute and elegant gifts crafted entirely from premium pipe cleaners.",
      placement: BannerPlacement.HERO,
      desktopMediaAssetId: heroMedia.id,
      mobileMediaAssetId: heroMedia.id,
      ctaLabel: "Shop Best Sellers",
      ctaUrl: "/collections/best-sellers",
      isActive: true,
      sortOrder: 1,
    }
  });

  const hpSection = await prisma.homepageSection.create({
    data: { key: "featured-products", title: "Featured Products", description: "Our most loved handcrafted pieces.", layout: { columns: 4 }, isActive: true, sortOrder: 1 }
  });

  for (let idx = 0; idx < 8; idx++) {
    await prisma.featuredProduct.create({
      data: { homepageSectionId: hpSection.id, productId: dbProducts[idx].id, sortOrder: idx + 1 }
    });
  }

  console.log("Realistic Demo data seeding completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });