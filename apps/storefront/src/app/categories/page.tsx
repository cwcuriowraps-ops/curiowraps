"use client";
import { motion } from "framer-motion";
import Link from "next/link";

import { useCategories } from "@/api/products";
import { getImageUrl } from "@/lib/image-utils";

export default function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useCategories();

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase mb-4">Explore</p>
          <h1 className="text-4xl font-serif text-text-primary">Categories</h1>
        </div>
        
        {isError ? (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-base font-medium text-text-primary mb-2">Unable to load categories</p>
            <p className="text-sm text-text-secondary mb-6 font-light">Something went wrong while connecting to the store. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square bg-muted animate-pulse rounded-full mb-6" />
                <div className="w-1/2 h-6 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : !data?.categories?.length ? (
          <div className="text-center py-16 text-text-secondary font-light">
            <p className="text-lg font-medium">No categories available.</p>
            <p className="text-sm mt-1">Check back later for newly added categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-16 md:grid-cols-3 lg:grid-cols-4">
            {data.categories.map((c: any, i: number) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <Link href={`/products?category=${c.slug}`} className="group flex flex-col items-center text-center">
                  <div className="w-full max-w-[240px] aspect-square rounded-full overflow-hidden bg-muted shadow-sm group-hover:shadow-lg transition-all duration-500 mb-6 relative flex items-center justify-center">
                    {c.imageUrl ? (
                      <img 
                        src={getImageUrl(c.imageUrl)} 
                        alt={c.name} 
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out" 
                      />
                    ) : (
                      <span className="font-serif text-lg text-text-secondary">{c.name}</span>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <h3 className="text-xl font-serif text-text-primary group-hover:text-accent transition-colors">
                    {c.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
