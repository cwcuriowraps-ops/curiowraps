import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminCategories = () => {
  const { token, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      return apiClient<{ data: { categories: any[] } }>("/admin/categories");
    },
    enabled: Boolean((_hasHydrated ?? true) && token),
    staleTime: 60 * 1000,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      console.log("[Category Mutation] Entered", data);
      const response = await apiClient("/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      console.log("[Category Mutation] API request resolved", response);
      return response;
    },
    onSuccess: async () => {
      console.log("[Category Mutation] Cache invalidation started");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["all-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
      ]);
      console.log("[Category Mutation] Cache invalidation and category-list refresh completed");
    },
    onError: (error) => console.error("[Category Mutation] Rejected", error),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient(`/admin/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};
