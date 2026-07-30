import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

export type AdminReviewParams = Record<string, string | number | boolean | undefined> & {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  rating?: string;
  status?: string;
};

export function useAdminReviews(params: AdminReviewParams = {}) {
  return useQuery({
    queryKey: ["admin", "reviews", params],
    queryFn: () =>
      apiClient<{
        reviews: any[];
        products?: { id: string; name: string }[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>("/admin/reviews", { params }),
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      apiClient<{ review: any }>(`/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });
}
