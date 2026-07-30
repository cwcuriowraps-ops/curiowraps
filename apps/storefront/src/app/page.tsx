"use client";

import { Button, Logo } from "@dashboard/ui";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

import { useCategories, useCollections, useFeaturedProducts } from "@/api/products";

const curioFeatures = [
  { title: "Handmade with Love", description: "Every piece is uniquely crafted", icon: "🤍" },
  { title: "Premium Quality", description: "Finest pipe cleaners used", icon: "✨" },
  { title: "Perfect Gifts", description: "Bring smiles to everyday life", icon: "🎁" },
  { title: "Custom Orders", description: "Made just for you", icon: "🎨" },
];


export default function HomePage() {
  const { data: catData, isLoading: catLoading } = useCategories();
  const { data: collData, isLoading: _collLoading } = useCollections();
  const { data: prodData, isLoading: prodLoading } = useFeaturedProducts();

  const allCategories: any[] = catData?.categories || [];
  const featuredCategories = allCategories.filter((c: any) => c.isFeatured);
  const categories = (featuredCategories.length >= 4
    ? featuredCategories.slice(0, 4)
    : [...featuredCategories, ...allCategories.filter((c: any) => !c.isFeatured)]
  ).slice(0, 4);

  const collections = collData?.categories?.length ? collData.categories.slice(0, 3) : [];
  const products = prodData?.products?.length ? prodData.products.slice(0, 4) : [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-24 lg:px-8 lg:pt-16 lg:pb-28">
          <motion.div
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-3xl text-center flex flex-col items-center"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="-mt-4 mb-2 sm:-mt-6 sm:mb-4"
            >
              <Logo size={180} />
            </motion.div>
            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-5xl font-serif text-text-primary sm:text-6xl lg:text-7xl leading-tight -mt-2"
            >
              Cute things,
              <br />
              <span className="italic">made with love.</span>
            </motion.h1>
            <motion.p
              custom={2}
              variants={fadeUp}
              className="mx-auto mt-6 max-w-xl text-lg text-text-secondary font-light"
            >
              Handcrafted pipe cleaner creations that bring smiles to everyday life.
              The perfect gift for yourself or someone special.
            </motion.p>
            <motion.div
              custom={3}
              variants={fadeUp}
              className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row"
            >
              <Link href="/products" className="w-full sm:w-fit">
                <Button size="lg" className="w-full sm:w-fit shadow-md hover:shadow-lg transition-all">
                  Shop Now
                </Button>
              </Link>
              <Link href="/collections" className="w-full sm:w-fit">
                <Button variant="outline" size="lg" className="w-full sm:w-fit gap-2">
                  <span>Explore Collections</span>
                  <span className="text-base leading-none">➔</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Soft Background Elements */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-serif text-text-primary mb-4">Featured Creations</h2>
          <p className="text-text-secondary font-light">Discover our most loved handmade pieces</p>
        </div>

        {prodLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-text-secondary font-light">
            <p className="text-base">No featured products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((prod: any, i: number) => (
              <motion.div
                key={prod.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group cursor-pointer"
              >
                <Link href={`/products/${prod.slug}`}>
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted relative">
                    {prod.images?.[0]?.url ? (
                      <Image
                        src={encodeURI(prod.images[0].url)}
                        alt={prod.name}
                        fill
                        priority={i < 2}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-text-secondary font-serif">
                        Curio Wrap
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="mt-6 text-center">
                    <h3 className="text-lg font-serif text-text-primary">{prod.name}</h3>
                    <p className="mt-2 text-sm text-text-secondary font-light">₹{prod.basePrice}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-16 text-center">
          <Link href="/products" className="text-accent hover:text-accent-hover font-medium underline underline-offset-8 transition-colors">
            View All Products
          </Link>
        </div>
      </section>

      {/* Why Curio Wrap */}
      <section className="bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-serif text-text-primary mb-4">Why Curio Wrap?</h2>
          </div>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {curioFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-sm border border-border text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-serif text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary font-light leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      {collections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-b border-border">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-serif text-text-primary mb-4">Curated Collections</h2>
            <p className="text-text-secondary font-light">Explore our specially themed creation sets</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {collections.map((coll: any, i: number) => (
              <motion.div
                key={coll.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group relative overflow-hidden rounded-2xl bg-muted aspect-[4/5] shadow-sm flex flex-col justify-end"
              >
                {coll.imageUrl ? (
                  <Image
                    src={encodeURI(coll.imageUrl)}
                    alt={coll.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center text-text-secondary font-serif text-xl">
                    {coll.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-serif mb-2">{coll.name}</h3>
                  <p className="text-xs text-white/80 font-light line-clamp-2 mb-4">{coll.description}</p>
                  <Link href={`/products?category=${coll.slug}`} className="inline-flex items-center text-xs font-medium tracking-wider uppercase text-accent hover:underline">
                    Shop Collection &rarr;
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-serif text-text-primary mb-4">Shop by Category</h2>
        </div>

        {catLoading ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-full bg-muted" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-text-secondary font-light">
            <p className="text-base">No categories available at the moment.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {categories.map((cat: any, i: number) => (
                <motion.div
                  key={cat.slug}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                >
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="group flex flex-col items-center"
                  >
                    <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-full bg-muted shadow-sm transition-shadow duration-500 group-hover:shadow-md relative flex items-center justify-center">
                      {cat.imageUrl ? (
                        <Image
                          src={encodeURI(cat.imageUrl)}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-serif text-lg text-text-secondary">{cat.name}</span>
                      )}
                    </div>
                    <h3 className="mt-6 text-lg font-serif text-text-primary group-hover:text-accent transition-colors text-center">
                      {cat.name}
                    </h3>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <Link href="/categories" className="text-accent hover:text-accent-hover font-medium underline underline-offset-8 transition-colors">
                View All Categories
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
