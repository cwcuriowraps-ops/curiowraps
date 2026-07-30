import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminInventory = (params: Record<string, any>) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-inventory", params],
    queryFn: async () => {
      return apiClient<{ data: any[]; meta: any }>("/admin/inventory", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
    },
    enabled: !!token,
  });
};

export const useInventoryLocations = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-inventory-locations"],
    queryFn: async () => {
      return apiClient<{ data: { locations: any[] } }>("/admin/inventory/locations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token,
  });
};

export const useAdjustInventory = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (data: {
      variantId: string;
      locationId: string;
      quantityChange: number;
      type: "ADJUSTMENT" | "SALE" | "RETURN" | "RESTOCK" | "TRANSFER" | "RESERVE" | "RELEASE";
      referenceType: string;
      note?: string;
    }) =>
      apiClient(`/admin/inventory/adjust`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
    },
  });
};
