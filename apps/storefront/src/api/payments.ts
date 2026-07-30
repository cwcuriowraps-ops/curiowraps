import { useMutation } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

interface CreateRazorpayResponse {
  id: string;
  orderId: string;
  providerOrderId: string;
  amount: string;
  currency: string;
}

interface VerifyRazorpayPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function useCreateRazorpayOrder() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient<CreateRazorpayResponse>("/payments/razorpay/create", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ orderId }),
      });
      return response;
    },
  });
}

export function useVerifyRazorpayPayment() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: VerifyRazorpayPayload) => {
      const response = await apiClient<any>("/payments/razorpay/verify", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(payload),
      });
      return response;
    },
  });
}

export function useCreateCodPayment() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient<any>("/payments/cod/create", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ orderId }),
      });
      return response;
    },
  });
}
