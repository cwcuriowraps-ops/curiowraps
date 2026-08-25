import { useToast } from "@dashboard/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export type ContactStatus = "UNREAD" | "READ" | "REPLIED" | "ARCHIVED";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const useContactMessages = (params: ContactFilterParams = {}) => {
  const { token } = useAuthStore();
  const { status, search, page = 1, limit = 20 } = params;

  const queryParams = new URLSearchParams();
  if (status && status !== "ALL") queryParams.append("status", status);
  if (search) queryParams.append("search", search);
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));

  return useQuery({
    queryKey: ["contact-messages", status, search, page, limit],
    queryFn: async () => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{
        data: {
          items: ContactMessage[];
          meta: { total: number; page: number; limit: number; totalPages: number };
          unreadCount: number;
        };
      }>(`/admin/contact-messages?${queryParams.toString()}`, { headers });
      return response.data;
    },
    enabled: !!token,
    staleTime: 60000,
    refetchInterval: 120000, // Background refresh every 2m
  });
};

export const useUnreadContactMessagesCount = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["contact-messages-unread-count"],
    queryFn: async () => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ data: { unreadCount: number } }>("/admin/contact-messages/unread-count", { headers });
      return response.data.unreadCount;
    },
    enabled: !!token,
    staleTime: 60000,
    refetchInterval: 120000, // Background refresh every 2m
  });
};

export const useUpdateContactMessageStatus = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, silent }: { id: string; status: ContactStatus; silent?: boolean }) => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ data: { message: ContactMessage; unreadCount: number }; message: string }>(
        `/admin/contact-messages/${id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status }),
        }
      );
      return { response, silent };
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      queryClient.invalidateQueries({ queryKey: ["contact-messages-unread-count"] });

      if (!variables.silent) {
        addToast({
          title: "Status Updated",
          description: `Message marked as ${variables.status.toLowerCase()}.`,
          type: "success",
        });
      }
    },
    onError: (error: any) => {
      addToast({
        title: "Failed to update status",
        description: error.message || "An unexpected error occurred.",
        type: "error",
      });
    },
  });
};

export const useDeleteContactMessage = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ message: string }>(`/admin/contact-messages/${id}`, {
        method: "DELETE",
        headers,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      queryClient.invalidateQueries({ queryKey: ["contact-messages-unread-count"] });

      addToast({
        title: "Message Deleted",
        description: "The message has been permanently deleted.",
        type: "success",
      });
    },
    onError: (error: any) => {
      addToast({
        title: "Failed to delete message",
        description: error.message || "An unexpected error occurred.",
        type: "error",
      });
    },
  });
};
