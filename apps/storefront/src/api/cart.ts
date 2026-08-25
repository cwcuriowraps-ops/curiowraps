import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const fetchCart = async (token: string | null) => {
  const res = await apiClient<{ data?: { cart: any }, cart?: any }>("/cart", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { cart: res?.data?.cart || res?.cart || null };
};

export const useCart = () => {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["cart", token],
    queryFn: () => fetchCart(token),
    staleTime: 60 * 1000,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { variantId: string; quantity: number; customization?: string }) => {
      const res = await apiClient<{ data?: { cart: any }, cart?: any }>("/cart/items", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(data),
      });
      return { cart: res?.data?.cart || res?.cart || null };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart", token], data);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { itemId: string; quantity: number }) => {
      const res = await apiClient<{ data?: { cart: any }, cart?: any }>(`/cart/items/${data.itemId}`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ quantity: data.quantity }),
      });
      return { cart: res?.data?.cart || res?.cart || null };
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["cart", token] });
      const previousCartData = queryClient.getQueryData(["cart", token]);
      queryClient.setQueryData(["cart", token], (old: any) => {
        if (!old?.cart?.items) return old;
        const newItems = old.cart.items.map((item: any) => {
          if (item.variantId === newData.itemId) {
            return { ...item, quantity: newData.quantity };
          }
          return item;
        });
        const subtotal = newItems.reduce((sum: number, item: any) => sum + (parseFloat(item.variant?.price?.toString() || "0") * item.quantity), 0);
        return {
          ...old,
          cart: {
            ...old.cart,
            items: newItems,
            totals: {
              ...old.cart.totals,
              subtotal,
              grandTotal: subtotal + (old.cart.totals?.shipping || 0) + (old.cart.totals?.tax || 0),
            }
          }
        };
      });
      return { previousCartData };
    },
    onError: (_err, _newData, context: any) => {
      if (context?.previousCartData) {
        queryClient.setQueryData(["cart", token], context.previousCartData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiClient<{ data?: { cart: any }, cart?: any }>(`/cart/items/${itemId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return { cart: res?.data?.cart || res?.cart || null };
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart", token] });
      const previousCartData = queryClient.getQueryData(["cart", token]);
      queryClient.setQueryData(["cart", token], (old: any) => {
        if (!old?.cart?.items) return old;
        const newItems = old.cart.items.filter((item: any) => item.variantId !== itemId);
        const subtotal = newItems.reduce((sum: number, item: any) => sum + (parseFloat(item.variant?.price?.toString() || "0") * item.quantity), 0);
        return {
          ...old,
          cart: {
            ...old.cart,
            items: newItems,
            totals: {
              ...old.cart.totals,
              subtotal,
              grandTotal: subtotal + (old.cart.totals?.shipping || 0) + (old.cart.totals?.tax || 0),
            }
          }
        };
      });
      return { previousCartData };
    },
    onError: (_err, _itemId, context: any) => {
      if (context?.previousCartData) {
        queryClient.setQueryData(["cart", token], context.previousCartData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
