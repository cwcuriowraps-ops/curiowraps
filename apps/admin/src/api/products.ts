import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminProducts = (params: Record<string, any>) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-products", params],
    queryFn: async () => {
      return apiClient<{ data: { products: any[] }; meta?: any }>("/admin/products", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });
};

export const useAdminProduct = (id: string) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-products", id],
    queryFn: async () => {
      return apiClient<{ data: { product: any } }>(`/admin/products/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token && !!id,
    staleTime: 60 * 1000,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (data: any) =>
      apiClient("/admin/products", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient(`/admin/products/${id}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/products/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};

export const useRestoreProduct = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/products/${id}/restore`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
};
