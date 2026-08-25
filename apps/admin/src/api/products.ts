import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminProducts = (params: Record<string, any>) => {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      return apiClient<{ data: { products: any[]; total: number }; meta?: any }>("/admin/products", {
        params,
      });
    },
    enabled: Boolean((_hasHydrated ?? true) && token),
    staleTime: 30 * 1000,
  });
};

export const useAdminProduct = (id: string) => {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["admin-products", id],
    queryFn: async () => {
      return apiClient<{ data: { product: any } }>(`/admin/products/${id}`);
    },
    enabled: Boolean((_hasHydrated ?? true) && token && id),
    staleTime: 60 * 1000,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiClient("/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient(`/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products", id] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useRestoreProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/products/${id}/restore`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};
