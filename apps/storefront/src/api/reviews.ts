import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";

export interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface ReviewItem {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  images: string[];
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
  product?: { id: string; name: string; slug: string; images?: any[] };
}

export interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
}

export interface EligibilityResponse {
  canReview: boolean;
  hasPurchased: boolean;
  isDelivered: boolean;
  existingReview: ReviewItem | null;
  reason?: string;
}

export interface SubmitReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  comment?: string;
  images?: string[];
}

export const useProductReviews = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async () => {
      if (!productId) return { reviews: [], stats: { averageRating: 0, reviewCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } };
      const res = await apiClient<{ reviews: ReviewItem[]; stats: ReviewStats }>(`/reviews?productId=${productId}`);
      return res;
    },
    enabled: !!productId,
  });
};

export const useReviewEligibility = (productId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: ["reviews", "eligibility", productId],
    queryFn: async () => {
      if (!productId) return null;
      const res = await apiClient<EligibilityResponse>(`/reviews/eligibility?productId=${productId}`);
      return res;
    },
    enabled: enabled && !!productId,
    retry: false,
  });
};

export const useMyReviews = () => {
  return useQuery({
    queryKey: ["reviews", "my-reviews"],
    queryFn: async () => {
      const res = await apiClient<{ reviews: ReviewItem[] }>("/reviews/my-reviews");
      return res;
    },
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitReviewPayload) => {
      const res = await apiClient<{ review: ReviewItem; message: string }>("/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "eligibility", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "my-reviews"] });
    },
  });
};
