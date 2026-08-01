"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useRef } from "react";

import { useInfiniteProducts, useCategories, type Product, type Category } from "@/api/products";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const categoryParam = searchParams.get("category");
  const brandParam = searchParams.get("brand");
  const searchParam = searchParams.get("q");

  const { data: categoriesData } = useCategories();
  const categoriesList: Category[] = categoriesData?.categories || [];

  const filters = {
    ...(categoryParam && { categoryId: categoriesList.find((c) => c.slug === categoryParam)?.id }),
    ...(searchParam && { search: searchParam }),
    ...(brandParam && { brand: brandParam }),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteProducts(filters);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    router.push(`/products?${params.toString()}`);
  };

  const allProducts: Product[] = data?.pages.flatMap((page) => page.products || []) || [];
  const totalProducts = data?.pages?.[0]?.total || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Minimal Header & Categories */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-serif text-text-primary mb-8">
          {searchParam ? `Search Results for "${searchParam}"` : "The Collection"}
        </h1>
        
        {!searchParam && (
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`text-sm tracking-widest uppercase transition-colors ${!categoryParam ? "text-accent border-b border-accent pb-1 font-semibold" : "text-text-secondary hover:text-text-primary"}`}
            >
              All
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`text-sm tracking-widest uppercase transition-colors ${categoryParam === cat.slug ? "text-accent border-b border-accent pb-1 font-semibold" : "text-text-secondary hover:text-text-primary"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error UI State */}
      {isError ? (
        <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-base font-medium text-text-primary mb-2">Unable to load products</p>
          <p className="text-sm text-text-secondary mb-6 font-light">Something went wrong while connecting to the store. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton UI State */
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
              <div className="h-4 w-3/4 mx-auto animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/4 mx-auto animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : allProducts.length === 0 ? (
        /* Empty UI State */
        <div className="mx-auto max-w-md text-center py-16">
          <p className="text-xl font-serif text-text-primary mb-2">No products found</p>
          <p className="text-sm text-text-secondary font-light mb-6">No handcrafted creations match your selected filters.</p>
          {(categoryParam || searchParam || brandParam) && (
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-sm font-medium hover:border-accent hover:text-accent transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* Success Product Grid State */
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {allProducts.map((prod, index) => (
            <motion.div
              key={prod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 12) * 0.04, duration: 0.4 }}
              className="group cursor-pointer"
            >
              <Link href={`/products/${prod.slug}`}>
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted relative">
                  {prod.images?.[0]?.url ? (
                    <Image
                      src={encodeURI(prod.images[0].url)}
                      alt={prod.name}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-full w-full object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-text-secondary font-serif">
                      {prod.name}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-serif text-text-primary line-clamp-1">{prod.name}</h3>
                  <p className="mt-2 text-sm text-text-secondary font-light">₹{prod.basePrice}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Infinite Scroll Loader & Footer */}
      {!isLoading && !isError && allProducts.length > 0 && (
        <div ref={loadMoreRef} className="mt-16 flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          )}
          {!hasNextPage && (
            <p className="text-sm text-text-secondary font-light">You&apos;ve reached the end of the collection ({totalProducts} items).</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="h-[60vh] w-full animate-pulse rounded-2xl bg-muted" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
