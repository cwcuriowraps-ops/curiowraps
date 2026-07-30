import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminBrands = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      return apiClient<{ data: { brands: any[] } }>("/admin/brands", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (data: any) =>
      apiClient("/admin/brands", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient(`/admin/brands/${id}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/brands/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    },
  });
};
