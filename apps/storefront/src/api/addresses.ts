import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export function useAddresses() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      return apiClient<{ addresses: any[] }>("/users/addresses", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    enabled: !!token,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: any) => {
      return apiClient<{ address: any }>("/users/addresses", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return apiClient<{ address: any }>(`/users/addresses/${id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<any>(`/users/addresses/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
}
