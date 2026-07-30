import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminCoupons = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      return apiClient<{ data: { coupons: any[] }; meta?: any }>("/admin/coupons", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (data: any) =>
      apiClient("/admin/coupons", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient(`/admin/coupons/${id}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/coupons/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });
};
