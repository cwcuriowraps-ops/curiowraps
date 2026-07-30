import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminCustomers = (params: Record<string, any>) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-customers", params],
    queryFn: async () => {
      const res = await apiClient<{ data: { items: any[]; meta: any } }>("/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      return {
        data: res.data,
        meta: {
          total: res.data.meta.total,
          pages: res.data.meta.totalPages,
        },
      };
    },
    enabled: !!token,
  });
};

export const useAdminCustomer = (id: string) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      return apiClient<{ data: { user: any } }>(`/admin/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token && !!id,
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/admin/users/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};
