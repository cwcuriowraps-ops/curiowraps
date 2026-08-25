import { useMutation } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

export function useCreateUpiPayment() {
  return useMutation({
    mutationFn: async (payload: string | { orderId: string; upiTransactionId?: string }) => {
      const bodyPayload = typeof payload === "string" ? { orderId: payload } : payload;
      const response = await apiClient<any>("/payments/upi/create", {
        method: "POST",
        body: JSON.stringify(bodyPayload),
      });
      return response?.data || response;
    },
  });
}

export function useCreateCodPayment() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient<any>("/payments/cod/create", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      return response?.data || response;
    },
  });
}
