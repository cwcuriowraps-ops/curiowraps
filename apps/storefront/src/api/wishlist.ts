import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useWishlist = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["wishlist", token],
    queryFn: () =>
      apiClient<{ items: any[] }>("/wishlist", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (data: { productId: string }) =>
      apiClient("/wishlist", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (productId: string) =>
      apiClient(`/wishlist/${productId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};
