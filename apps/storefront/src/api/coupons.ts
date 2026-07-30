import { useMutation } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

interface ValidateCouponPayload {
  code: string;
  cartTotal: number;
}

export function useValidateCoupon() {
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: ValidateCouponPayload) => {
      const response = await apiClient<any>("/coupons/validate", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(payload),
      });
      return response.data || response;
    },
  });
}
