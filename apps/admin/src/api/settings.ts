import { useToast } from "@dashboard/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export interface EmailSettingsPayload {
  senderName: string;
  senderEmail: string;
  replyToEmail?: string;
}

export const useSettings = (keys?: string[]) => {
  const { token } = useAuthStore();
  const queryParams = keys?.length ? `?keys=${keys.join(",")}` : "";

  return useQuery({
    queryKey: ["settings", keys],
    queryFn: async () => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ data: { settings: Record<string, any> } }>(`/admin/settings${queryParams}`, { headers });
      return response.data.settings;
    },
    enabled: !!token,
  });
};

export const useUpdateSettings = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ data: { settings: Record<string, any> } }>("/admin/settings", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ settings }),
      });
      return response.data.settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", undefined], data);
      addToast({ title: "Settings saved successfully", type: "success" });
    },
    onError: (error: any) => {
      addToast({ title: "Failed to save settings", description: error.message || "An unexpected error occurred.", type: "error" });
    },
  });
};

export const useEmailSettings = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ data: EmailSettingsPayload }>("/admin/settings/email", { headers });
      return response.data;
    },
    enabled: !!token,
  });
};

export const useUpdateEmailSettings = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (payload: EmailSettingsPayload) => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ data: EmailSettingsPayload; message: string }>("/admin/settings/email", {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      return response;
    },
    onSuccess: (res) => {
      queryClient.setQueryData(["email-settings"], res.data);
      addToast({ title: "Email Settings Saved", description: res.message || "Updated sender configurations successfully.", type: "success" });
    },
    onError: (error: any) => {
      addToast({
        title: "Failed to save email settings",
        description: error?.message || "An unexpected error occurred.",
        type: "error",
      });
    },
  });
};

export const useSendTestEmail = () => {
  const { token } = useAuthStore();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (targetEmail?: string) => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await apiClient<{ message: string }>("/admin/settings/email/test", {
        method: "POST",
        headers,
        body: JSON.stringify({ targetEmail }),
      });
      return response;
    },
    onSuccess: (res) => {
      addToast({
        title: "Test Email Sent",
        description: res.message || "Test email dispatched successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      addToast({
        title: "Test Email Delivery Failed",
        description: error?.message || "Brevo SMTP rejected the email dispatch.",
        type: "error",
      });
    },
  });
};
