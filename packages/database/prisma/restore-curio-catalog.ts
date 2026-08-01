import { PrismaClient, ProductStatus, MediaType, BannerPlacement } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Restoring Curio Wrap original catalog and media assets...");

  // 1. Register Uploaded Media Assets
  const uploadedFiles = [
    { key: "hero_banner_1784131993305.png", name: "Hero Banner", alt: "Curio Wrap Hero Banner" },
    { key: "pink_tulip_1784132003132.png", name: "Pink Tulip Bouquet", alt: "Pink Tulip Bouquet" },
    { key: "lavender_rose_1784132013901.png", name: "Lavender Rose Bouquet", alt: "Lavender Rose Bouquet" },
    { key: "mini_panda_1784132026191.png", name: "Mini Panda Craft", alt: "Mini Panda Craft" },
    { key: "cute_rabbit_1784132037420.png", name: "Cloud Bunny Rabbit", alt: "Cloud Bunny Rabbit" },
    { key: "teddy_bear_1784132048835.png", name: "Tiny Teddy Bear", alt: "Tiny Teddy Bear" },
    { key: "keychain_duck_1784132060346.png", name: "Handcrafted Duck Keychain", alt: "Handcrafted Duck Keychain" },
    { key: "home_decor_1784132070975.png", name: "Flower Basket Home Decor", alt: "Flower Basket Home Decor" },
    { key: "media__1784126340078.png", name: "Curio Studio Craft", alt: "Curio Studio Craft" },
    { key: "0c0e44361ca929fa-Screenshot 2026-07-23 at 7.50.51\u202fPM.png", name: "Upload Screenshot 1", alt: "User Upload 1" },
    { key: "3f8ad6fb1eab1e5a-Screenshot 2026-07-19 at 1.19.26\u202fAM.png", name: "Upload Screenshot 2", alt: "User Upload 2" },
    { key: "466d056dbfe164ff-Screenshot 2026-07-19 at 1.19.26\u202fAM.png", name: "Upload Screenshot 3", alt: "User Upload 3" },
    { key: "aede85abcedf8430-Screenshot 2026-07-23 at 7.50.51\u202fPM.png", name: "Upload Screenshot 4", alt: "User Upload 4" },
  ];

  const mediaMap: Record<string, any> = {};
  for (const f of uploadedFiles) {
    const asset = await prisma.mediaAsset.upsert({
      where: { checksum: f.key },
      update: { publicUrl: `/uploads/${f.key}` },
      create: {
        checksum: f.key,
        storageKey: f.key,
        publicUrl: `/uploads/${f.key}`,
        mimeType: "image/png",
        sizeInBytes: 600000,
        type: MediaType.IMAGE,
        altText: f.alt,
        title: f.name,
      },
    });
    mediaMap[f.key] = asset;
  }
  console.log(`Registered ${Object.keys(mediaMap).length} media assets in database.`);

  // 2. Curio Categories
  const categoryDefs = [
    { slug: "bouquets", name: "Bouquets", imageKey: "lavender_rose_1784132013901.png", isFeatured: true },
    { slug: "flowers", name: "Flowers", imageKey: "pink_tulip_1784132003132.png", isFeatured: true },
    { slug: "teddy-bears", name: "Teddy Bears", imageKey: "teddy_bear_1784132048835.png", isFeatured: true },
    { slug: "rabbits", name: "Rabbits", imageKey: "cute_rabbit_1784132037420.png", isFeatured: true },
    { slug: "pandas", name: "Pandas", imageKey: "mini_panda_1784132026191.png", isFeatured: false },
    { slug: "keychains", name: "Keychains", imageKey: "keychain_duck_1784132060346.png", isFeatured: false },
    { slug: "gift-sets", name: "Gift Sets", imageKey: "pink_tulip_1784132003132.png", isFeatured: false },
    { slug: "home-decor", name: "Home Decor", imageKey: "home_decor_1784132070975.png", isFeatured: false },
  ];

  const catMap: Record<string, any> = {};
  for (let i = 0; i < categoryDefs.length; i++) {
    const c = categoryDefs[i];
    catMap[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        imageUrl: mediaMap[c.imageKey]?.publicUrl,
        isFeatured: c.isFeatured,
      },
      create: {
        slug: c.slug,
        name: c.name,
        imageUrl: mediaMap[c.imageKey]?.publicUrl,
        isFeatured: c.isFeatured,
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }
  console.log(`Created ${Object.keys(catMap).length} categories.`);

  // 3. Curio Collections / Brands
  const collectionDefs = [
    { slug: "best-sellers", name: "Best Sellers" },
    { slug: "new-arrivals", name: "New Arrivals" },
    { slug: "most-loved", name: "Most Loved" },
    { slug: "birthday-gifts", name: "Birthday Gifts" },
    { slug: "valentine-collection", name: "Valentine Collection" },
    { slug: "cute-desk-decor", name: "Cute Desk Decor" },
  ];

  const brandMap: Record<string, any> = {};
  for (const coll of collectionDefs) {
    brandMap[coll.slug] = await prisma.brand.upsert({
      where: { slug: coll.slug },
      update: {},
      create: { slug: coll.slug, name: coll.name, isActive: true },
    });
  }

  // 4. Warehouse Location
  const location = await prisma.inventoryLocation.findFirst({
    where: { code: "WH-MAIN-01" },
  });

  // 5. Authentic Products
  const productsToRestore = [
    {
      name: "Pink Tulip Bouquet",
      slug: "pink-tulip-bouquet",
      subtitle: "Handmade pipe cleaner pink tulip arrangement",
      description: "A gorgeous, everlasting pink tulip bouquet handcrafted with premium soft pipe cleaners. Designed to bring warmth and elegance to any room or workspace.",
      price: 1299,
      categorySlug: "flowers",
      brandSlug: "best-sellers",
      imageKey: "pink_tulip_1784132003132.png",
      isFeatured: true,
      sku: "CW-TLP-PNK-01",
    },
    {
      name: "Lavender Rose Bouquet",
      slug: "lavender-rose-bouquet",
      subtitle: "Handmade pipe cleaner lavender rose arrangement",
      description: "Artfully sculpted lavender roses crafted with high quality pipe cleaners. A romantic, lifelong keepsake perfect for anniversaries, birthdays, or self-care gifting.",
      price: 1499,
      categorySlug: "bouquets",
      brandSlug: "valentine-collection",
      imageKey: "lavender_rose_1784132013901.png",
      isFeatured: true,
      sku: "CW-ROS-LAV-01",
    },
    {
      name: "Mini Panda Craft",
      slug: "mini-panda-craft",
      subtitle: "Cute handcrafted pipe cleaner panda desk buddy",
      description: "An adorable mini panda figurine meticulously shaped by hand. Adds charm to your study desk, office table, or bookshelf.",
      price: 799,
      categorySlug: "pandas",
      brandSlug: "cute-desk-decor",
      imageKey: "mini_panda_1784132026191.png",
      isFeatured: true,
      sku: "CW-PND-MIN-01",
    },
    {
      name: "Cloud Bunny Rabbit",
      slug: "cloud-bunny-rabbit",
      subtitle: "Soft handmade pipe cleaner bunny rabbit",
      description: "Fluffy and sweet, this handcrafted white-and-pink bunny rabbit is sculpted to bring instant smiles. Made with plush premium chenille stems.",
      price: 899,
      categorySlug: "rabbits",
      brandSlug: "new-arrivals",
      imageKey: "cute_rabbit_1784132037420.png",
      isFeatured: true,
      sku: "CW-RBT-CLD-01",
    },
    {
      name: "Tiny Teddy Bear",
      slug: "tiny-teddy-bear",
      subtitle: "Handmade pipe cleaner teddy bear companion",
      description: "A cozy, charming handcrafted teddy bear. Fits comfortably in your palm and makes a delightful token of affection.",
      price: 999,
      categorySlug: "teddy-bears",
      brandSlug: "most-loved",
      imageKey: "teddy_bear_1784132048835.png",
      isFeatured: false,
      sku: "CW-TED-TNY-01",
    },
    {
      name: "Handcrafted Duck Keychain",
      slug: "handcrafted-duck-keychain",
      subtitle: "Cute pipe cleaner yellow duck bag charm",
      description: "A vibrant yellow duck keychain handcrafted with care. Attaches smoothly to keys, backpacks, or handbags for an instant pop of joy.",
      price: 499,
      categorySlug: "keychains",
      brandSlug: "best-sellers",
      imageKey: "keychain_duck_1784132060346.png",
      isFeatured: false,
      sku: "CW-KEY-DCK-01",
    },
    {
      name: "Flower Basket Home Decor",
      slug: "flower-basket-home-decor",
      subtitle: "Handmade pipe cleaner mini flower basket",
      description: "A miniature decorative basket filled with handcrafted pipe cleaner wildflowers. A unique centerpiece for coffee tables and sideboards.",
      price: 1899,
      categorySlug: "home-decor",
      brandSlug: "cute-desk-decor",
      imageKey: "home_decor_1784132070975.png",
      isFeatured: false,
      sku: "CW-DEC-BSK-01",
    },
    {
      name: "Curio Deluxe Gift Box",
      slug: "curio-deluxe-gift-box",
      subtitle: "Handmade pipe cleaner bouquet & craft gift set",
      description: "The ultimate handcrafted gift box featuring a mixed pipe cleaner floral arrangement, mini craft buddy, and personalized gift wrap.",
      price: 2199,
      categorySlug: "gift-sets",
      brandSlug: "birthday-gifts",
      imageKey: "pink_tulip_1784132003132.png",
      isFeatured: false,
      sku: "CW-GFT-DLX-01",
    },
  ];

  for (const item of productsToRestore) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        subtitle: item.subtitle,
        description: item.description,
        shortDescription: item.subtitle,
        status: ProductStatus.ACTIVE,
        brandId: brandMap[item.brandSlug]?.id,
        isFeatured: item.isFeatured,
      },
      create: {
        slug: item.slug,
        name: item.name,
        subtitle: item.subtitle,
        description: item.description,
        shortDescription: item.subtitle,
        status: ProductStatus.ACTIVE,
        brandId: brandMap[item.brandSlug]?.id,
        isFeatured: item.isFeatured,
        taxable: true,
        requiresShipping: true,
      },
    });

    // Link Category
    const cat = catMap[item.categorySlug];
    if (cat) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: cat.id } },
        update: {},
        create: { productId: product.id, categoryId: cat.id },
      });
    }

    // Link Variant
    const variant = await prisma.productVariant.upsert({
      where: { sku: item.sku },
      update: { price: item.price },
      create: {
        productId: product.id,
        sku: item.sku,
        title: "Standard",
        optionValues: {},
        price: item.price,
        isDefault: true,
        isActive: true,
      },
    });

    // Stock Inventory
    if (location) {
      await prisma.inventory.upsert({
        where: { variantId_locationId: { variantId: variant.id, locationId: location.id } },
        update: { quantityOnHand: 50 },
        create: { variantId: variant.id, locationId: location.id, quantityOnHand: 50 },
      });
    }

    // Image
    const media = mediaMap[item.imageKey];
    if (media) {
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          mediaAssetId: media.id,
          url: media.publicUrl,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }
  }

  // 6. Homepage Featured Section & Hero Banner
  const hpSection = await prisma.homepageSection.upsert({
    where: { key: "featured-products" },
    update: { isActive: true, title: "Featured Creations" },
    create: {
      key: "featured-products",
      title: "Featured Creations",
      description: "Discover our most loved handmade pieces",
      layout: { columns: 4 },
      isActive: true,
      sortOrder: 1,
    },
  });

  const featuredProds = await prisma.product.findMany({
    where: { isFeatured: true },
    take: 4,
  });

  await prisma.featuredProduct.deleteMany({
    where: { homepageSectionId: hpSection.id },
  });

  for (let idx = 0; idx < featuredProds.length; idx++) {
    await prisma.featuredProduct.create({
      data: {
        homepageSectionId: hpSection.id,
        productId: featuredProds[idx].id,
        sortOrder: idx + 1,
      },
    });
  }

  const heroMedia = mediaMap["hero_banner_1784131993305.png"];
  if (heroMedia) {
    await prisma.banner.deleteMany({ where: { placement: BannerPlacement.HERO } });
    await prisma.banner.create({
      data: {
        title: "Cute things, made with love.",
        subtitle: "Handcrafted pipe cleaner creations that bring smiles to everyday life.",
        placement: BannerPlacement.HERO,
        desktopMediaAssetId: heroMedia.id,
        mobileMediaAssetId: heroMedia.id,
        ctaLabel: "Shop Now",
        ctaUrl: "/products",
        isActive: true,
        sortOrder: 1,
      },
    });
  }

  console.log("=== CURIO WRAP CATALOG RESTORATION COMPLETE ===");
}

main()
  .catch((e) => {
    console.error("Restoration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
