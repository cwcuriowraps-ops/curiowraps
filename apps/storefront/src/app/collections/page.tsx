"use client";

import { Button } from "@dashboard/ui";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";

import { apiClient } from "@/lib/api-client";

export default function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => apiClient<any>("/categories?featured=true")
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-medium tracking-[0.2em] text-accent uppercase mb-4">Curated</p>
          <h1 className="text-4xl font-serif text-text-primary">Our Collections</h1>
        </div>
        
        {isLoading ? (
          <div className="space-y-24">
            {[1,2].map(i => <div key={i} className="h-96 w-full bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : !data?.categories?.length ? (
          <div className="text-center py-16 text-text-secondary font-light">
            <p className="text-lg font-medium">No collections available.</p>
            <p className="text-sm mt-1">Check back later for curated collections.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {data.categories.map((c: any, i: number) => (
              <motion.div 
                key={c.id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
              >
                <div className="w-full md:w-1/2">
                  <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-sm relative group bg-muted flex items-center justify-center">
                    {c.imageUrl ? (
                      <img src={encodeURI(c.imageUrl)} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <span className="font-serif text-2xl text-text-secondary">{c.name}</span>
                    )}
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                </div>
                <div className={`w-full md:w-1/2 p-8 ${i % 2 === 0 ? 'md:pl-16' : 'md:pr-16'}`}>
                  <h2 className="text-4xl font-serif mb-6 text-text-primary">{c.name}</h2>
                  <Link href={`/products?category=${c.slug}`}>
                    <Button size="lg" className="px-8 shadow-sm hover:shadow-md transition-shadow">
                      Explore {c.name}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
