import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminOrders = (params: Record<string, any>) => {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: async () => {
      return apiClient<{ data: { orders: any[] }; meta?: any }>("/admin/orders", {
        params,
      });
    },
    enabled: Boolean((_hasHydrated ?? true) && token),
    staleTime: 30 * 1000,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};

export const useAdminOrder = (id: string) => {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["admin-orders", id],
    queryFn: async () => {
      return apiClient<{ data: { order: any } }>(`/admin/orders/${id}`);
    },
    enabled: Boolean((_hasHydrated ?? true) && token && id),
  });
};

export const useUpdateOrderPaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) =>
      apiClient(`/admin/orders/${id}/payment-status`, {
        method: "PATCH",
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

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ success: boolean; message: string }>(`/admin/orders/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
};
