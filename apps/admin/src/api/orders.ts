import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminOrders = (params: Record<string, any>) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: async () => {
      return apiClient<{ data: { orders: any[] }; meta?: any }>("/admin/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient(`/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useAdminOrder = (id: string) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-orders", id],
    queryFn: async () => {
      return apiClient<{ data: { order: any } }>(`/admin/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token && !!id,
  });
};

export const useUpdateOrderPaymentStatus = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      apiClient(`/admin/orders/${id}/payment-status`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ paymentStatus }),
      }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ success: boolean; message: string }>(`/admin/orders/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};
