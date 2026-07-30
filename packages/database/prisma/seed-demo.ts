import { PrismaClient, ProductStatus, MediaType, BannerPlacement } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting full demo seed...");

  // Images
  const files = [
    { key: "hero_banner_1784131993305.png", name: "hero" },
    { key: "pink_tulip_1784132003132.png", name: "pink_tulip" },
    { key: "lavender_rose_1784132013901.png", name: "lavender_rose" },
    { key: "mini_panda_1784132026191.png", name: "mini_panda" },
    { key: "cute_rabbit_1784132037420.png", name: "cute_rabbit" },
    { key: "teddy_bear_1784132048835.png", name: "teddy_bear" },
    { key: "keychain_duck_1784132060346.png", name: "keychain_duck" },
    { key: "home_decor_1784132070975.png", name: "home_decor" },
  ];

  const mediaMap: Record<string, any> = {};

  for (const f of files) {
    const asset = await prisma.mediaAsset.upsert({
      where: { checksum: f.name }, // Use name as checksum for simplicity
      update: { publicUrl: `/uploads/${f.key}` },
      create: {
        checksum: f.name,
        storageKey: f.key,
        publicUrl: `/uploads/${f.key}`,
        mimeType: "image/png",
        sizeInBytes: 500000,
        type: MediaType.IMAGE,
        altText: f.name,
        title: f.name,
      }
    });
    mediaMap[f.name] = asset;
  }

  // Categories
  const categoryData = [
    { slug: "flowers", name: "Flowers", image: "pink_tulip" },
    { slug: "bouquets", name: "Bouquets", image: "lavender_rose" },
    { slug: "teddy-bears", name: "Teddy Bears", image: "teddy_bear" },
    { slug: "rabbits", name: "Rabbits", image: "cute_rabbit" },
    { slug: "pandas", name: "Pandas", image: "mini_panda" },
    { slug: "cute-animals", name: "Cute Animals", image: "teddy_bear" },
    { slug: "mini-animals", name: "Mini Animals", image: "cute_rabbit" },
    { slug: "keychains", name: "Keychains", image: "keychain_duck" },
    { slug: "gift-sets", name: "Gift Sets", image: "pink_tulip" },
    { slug: "home-decor", name: "Home Decor", image: "home_decor" },
    { slug: "seasonal-collection", name: "Seasonal Collection", image: "lavender_rose" },
    { slug: "custom-orders", name: "Custom Orders", image: "home_decor" },
  ];

  const catMap: Record<string, any> = {};
  for (let i = 0; i < categoryData.length; i++) {
    const c = categoryData[i];
    catMap[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { imageUrl: mediaMap[c.image].publicUrl },
      create: {
        slug: c.slug,
        name: c.name,
        imageUrl: mediaMap[c.image].publicUrl,
        sortOrder: i,
        isActive: true,
      }
    });
  }

  // Brands / Collections
  const collData = [
    "Best Sellers", "New Arrivals", "Most Loved", "Birthday Gifts", "Anniversary Gifts", 
    "Mother's Day", "Valentine Collection", "Festival Collection", "Cute Desk Decor", "Limited Edition"
  ];
  const brandMap: Record<string, any> = {};
  for (const cName of collData) {
    const slug = cName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    brandMap[slug] = await prisma.brand.upsert({
      where: { slug },
      update: {},
      create: { slug, name: cName, isActive: true }
    });
  }

  // Helper to get random item
  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

  // Create products
  const productTemplates = [
    { base: "Tulip Bouquet", cat: "flowers", brand: "best-sellers", image: "pink_tulip" },
    { base: "Rose Bouquet", cat: "bouquets", brand: "valentine-collection", image: "lavender_rose" },
    { base: "Mini Panda", cat: "pandas", brand: "cute-desk-decor", image: "mini_panda" },
    { base: "Cloud Bunny", cat: "rabbits", brand: "new-arrivals", image: "cute_rabbit" },
    { base: "Tiny Teddy", cat: "teddy-bears", brand: "most-loved", image: "teddy_bear" },
    { base: "Duck Keychain", cat: "keychains", brand: "best-sellers", image: "keychain_duck" },
    { base: "Flower Basket", cat: "home-decor", brand: "festival-collection", image: "home_decor" },
  ];

  const colors = ["Pink", "Lavender", "Blue", "White", "Yellow", "Rainbow", "Mint", "Peach", "Ruby"];
  
  let skuCounter = 1000;
  for (let i = 1; i <= 60; i++) {
    const tpl = productTemplates[i % productTemplates.length];
    const color = getRandom(colors);
    const pName = `${color} ${tpl.base} ${Math.floor(Math.random() * 1000)}`;
    const slug = pName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: pName,
        subtitle: `Handmade pipe cleaner ${tpl.base.toLowerCase()}`,
        description: `This is a beautiful, hand-crafted ${tpl.base.toLowerCase()}. Perfect for gifting, home decor, or as a special treat for yourself. Made entirely out of premium pipe cleaners with love and care.`,
        shortDescription: `Handmade pipe cleaner ${tpl.base.toLowerCase()}`,
        status: ProductStatus.ACTIVE,
        brandId: brandMap[tpl.brand].id,
        isFeatured: i <= 8,
        taxable: true,
        requiresShipping: true,
      }
    });

    // Category
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: product.id, categoryId: catMap[tpl.cat].id } },
      update: {},
      create: { productId: product.id, categoryId: catMap[tpl.cat].id }
    });

    // Variant
    const sku = `SKU-${skuCounter++}`;
    const variant = await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: product.id,
        sku,
        title: "Default Title",
        optionValues: {},
        price: 999 + (Math.floor(Math.random() * 20) * 100),
        isDefault: true,
        isActive: true,
      }
    });

    // Location
    const location = await prisma.inventoryLocation.findFirst();
    if (location) {
       await prisma.inventory.upsert({
         where: { variantId_locationId: { variantId: variant.id, locationId: location.id } },
         update: { quantityOnHand: 50 },
         create: { variantId: variant.id, locationId: location.id, quantityOnHand: 50 }
       });
    }

    // Image
    const media = mediaMap[tpl.image];
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        mediaAssetId: media.id,
        url: media.publicUrl,
        isPrimary: true,
        sortOrder: 0
      }
    });

    const randomImg = mediaMap[getRandom(files).name];
    if (randomImg.id !== media.id) {
       await prisma.productImage.create({
         data: {
           productId: product.id,
           mediaAssetId: randomImg.id,
           url: randomImg.publicUrl,
           isPrimary: false,
           sortOrder: 1
         }
       });
    }
  }

  // Homepage Section
  await prisma.homepageSection.upsert({
    where: { key: "featured-products" },
    update: { isActive: true },
    create: {
      key: "featured-products",
      title: "Featured Products",
      description: "Our best creations",
      layout: { columns: 4 },
      isActive: true,
      sortOrder: 1,
    },
  });

  // Hero Banner
  await prisma.banner.deleteMany({ where: { placement: BannerPlacement.HERO } });
  await prisma.banner.create({
    data: {
      title: "Handcrafted Gifts • Unique Blooms • Artfully Made",
      subtitle: "Discover beautiful, everlasting pipe cleaner bouquets and crafts.",
      placement: BannerPlacement.HERO,
      desktopMediaAssetId: mediaMap["hero"].id,
      mobileMediaAssetId: mediaMap["hero"].id,
      ctaLabel: "Shop the Spring Collection",
      ctaUrl: "/products",
      isActive: true,
      sortOrder: 1,
    }
  });

  console.log("Demo seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
