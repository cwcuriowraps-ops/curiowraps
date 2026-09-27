import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  variants: any[];
  images: any[];
  basePrice?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount: number;
  href: string;
  type: "brand" | "category";
}

// Normalized Fetchers (Unwraps backend { success: true, data: { ... } } structure)
export const fetchCategories = async () => {
  const res = await apiClient<{ data?: { categories: Category[] }; categories?: Category[] }>("/categories");
  return { categories: res?.data?.categories || res?.categories || [] };
};

export const fetchCollections = async () => {
  type BrandRes = { data?: { brands: any[] }; brands?: any[] };
  type CatRes = { data?: { categories: any[] }; categories?: any[] };

  const [brandsRes, catRes] = await Promise.all([
    apiClient<BrandRes>("/brands").catch((): BrandRes => ({ data: { brands: [] } })),
    apiClient<CatRes>("/categories?featured=true").catch((): CatRes => ({ data: { categories: [] } })),
  ]);

  const rawBrands = brandsRes?.data?.brands || brandsRes?.brands || [];
  const rawCategories = catRes?.data?.categories || catRes?.categories || [];

  const collections: Collection[] = [
    ...rawBrands.map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      imageUrl: b.logoUrl,
      productCount: b._count?.products ?? b.products?.length ?? 0,
      href: `/products?brand=${encodeURIComponent(b.slug)}`,
      type: "brand" as const,
    })),
    ...rawCategories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      productCount: c._count?.products ?? c.products?.length ?? 0,
      href: `/products?category=${encodeURIComponent(c.slug)}`,
      type: "category" as const,
    })),
  ].filter((col) => col.productCount > 0);

  return { collections, categories: collections };
};

export const fetchProducts = async (params?: Record<string, any>) => {
  const res = await apiClient<{ data?: { products: Product[]; total: number }; products?: Product[]; total?: number }>("/products", { params });
  return {
    products: res?.data?.products || res?.products || [],
    total: res?.data?.total ?? res?.total ?? 0,
  };
};

export const fetchProductBySlug = async (slug: string) => {
  const res = await apiClient<{ data?: { product: Product }; product?: Product }>(`/products/${slug}`);
  return { product: res?.data?.product || res?.product || null };
};

// Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useCollections = () => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () => fetchCollections(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ limit: 4, sort: "createdAt_desc" }),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useInfiniteProducts = (filters: Record<string, any> = {}) => {
  return useInfiniteQuery({
    queryKey: ["products", "list", filters],
    queryFn: async ({ pageParam = 1 }) => {
      return fetchProducts({ ...filters, page: pageParam, limit: 12 });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentLoaded = allPages.length * 12;
      return currentLoaded < (lastPage?.total || 0) ? allPages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};
