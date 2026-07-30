import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

interface CreateOrderPayload {
  paymentMethod: "RAZORPAY" | "COD";
  shippingAddress: Record<string, string>;
  billingAddress?: Record<string, string>;
  couponCode?: string;
  notes?: string;
}

export function useCreateOrder() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const response = await apiClient<any>("/orders", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(payload),
      });
      return response;
    },
  });
}

export function useOrders() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return apiClient<{ orders: any[] }>("/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token,
  });
}

export function useOrder(id: string) {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      return apiClient<{ order: any }>(`/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token && !!id,
  });
}
