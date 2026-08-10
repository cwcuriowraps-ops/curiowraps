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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist", token] });
      const previousWishlist = queryClient.getQueryData<{ items: any[] }>(["wishlist", token]);
      if (previousWishlist?.items) {
        queryClient.setQueryData(["wishlist", token], {
          ...previousWishlist,
          items: [...previousWishlist.items, { id: `temp-${Date.now()}`, productId: data.productId }],
        });
      }
      return { previousWishlist };
    },
    onError: (_err, _data, context: any) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist", token], context.previousWishlist);
      }
    },
    onSettled: () => {
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
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist", token] });
      const previousWishlist = queryClient.getQueryData<{ items: any[] }>(["wishlist", token]);
      if (previousWishlist?.items) {
        queryClient.setQueryData(["wishlist", token], {
          ...previousWishlist,
          items: previousWishlist.items.filter((item: any) => item.productId !== productId && item.id !== productId),
        });
      }
      return { previousWishlist };
    },
    onError: (_err, _productId, context: any) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist", token], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

