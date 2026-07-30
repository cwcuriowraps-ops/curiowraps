"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { apiClient } from "@/lib/api-client";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: () => apiClient<any>("/search", { params: { keyword: query } }),
    enabled: !!query
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase mb-4">Search Results</p>
          <h1 className="text-4xl font-serif text-text-primary">
            {query ? `"${query}"` : "Search"}
          </h1>
        </div>

        {!query && <p className="text-text-secondary text-center font-light">Please enter a search term.</p>}
        
        {isLoading && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-8">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />)}
          </div>
        )}

        {query && !isLoading && data?.items?.length === 0 && (
          <div className="py-24 text-center">
            <h2 className="text-2xl font-serif text-text-primary mb-4">No creations found</h2>
            <p className="text-text-secondary font-light">Try searching for something else or explore our collections.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-8">
          {data?.items?.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/products/${p.slug}`} className="group block">
                <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-muted mb-4 relative shadow-sm flex items-center justify-center">
                  {p.images?.[0]?.url ? (
                    <img
                      src={encodeURI(p.images[0].url)}
                      alt={p.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <span className="font-serif text-sm text-text-secondary">{p.name}</span>
                  )}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary">{p.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary font-light">₹{p.basePrice}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="mx-auto h-10 w-48 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-8">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />)}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
