import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

// Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
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

// Normalized Fetchers (Unwraps backend { success: true, data: { ... } } structure)
export const fetchCategories = async () => {
  const res = await apiClient<{ data?: { categories: Category[] }; categories?: Category[] }>("/categories");
  return { categories: res?.data?.categories || res?.categories || [] };
};

export const fetchCollections = async () => {
  const res = await apiClient<{ data?: { categories: Category[] }; categories?: Category[] }>("/categories?featured=true");
  return { categories: res?.data?.categories || res?.categories || [] };
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
