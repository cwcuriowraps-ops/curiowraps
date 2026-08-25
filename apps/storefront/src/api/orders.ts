import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

interface CreateOrderPayload {
  paymentMethod: "UPI" | "COD";
  shippingAddress: Record<string, string>;
  billingAddress?: Record<string, string>;
  couponCode?: string;
  notes?: string;
  upiTransactionId?: string;
  buyNowItem?: {
    variantId: string;
    quantity: number;
    customization?: string;
  };
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const response = await apiClient<any>("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return response?.data || response;
    },
  });
}

export function useOrders() {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await apiClient<any>("/orders");
      return response?.data || response;
    },
    enabled: Boolean((_hasHydrated ?? true) && token),
  });
}

export function useOrder(id: string) {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const response = await apiClient<any>(`/orders/${id}`);
      return response?.data || response;
    },
    enabled: Boolean((_hasHydrated ?? true) && token && id),
  });
}
