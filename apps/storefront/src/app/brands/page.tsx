"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { apiClient } from "@/lib/api-client";

export default function BrandsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-brands"],
    queryFn: () => apiClient<any>("/brands")
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8 text-text-primary">Featured Brands</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : !data?.brands?.length ? (
        <div className="text-center py-16 text-text-secondary font-light">
          <p className="text-lg font-medium">No brands available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {data.brands.map((b: any) => (
            <Link key={b.id} href={`/products?brand=${b.slug}`} className="flex items-center justify-center p-6 border border-border rounded-lg hover:border-primary transition-colors bg-surface">
              <h3 className="text-lg font-bold text-text-primary">{b.name}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}