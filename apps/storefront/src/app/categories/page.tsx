"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";

import { apiClient } from "@/lib/api-client";

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-categories"],
    queryFn: () => apiClient<any>("/categories")
  });

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase mb-4">Explore</p>
          <h1 className="text-4xl font-serif text-text-primary">Categories</h1>
        </div>
        
        {isLoading ? (
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
                        src={encodeURI(c.imageUrl)} 
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
