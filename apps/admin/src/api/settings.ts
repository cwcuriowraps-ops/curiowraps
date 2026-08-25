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
  const { token, _hasHydrated } = useAuthStore();
  const queryParams = keys?.length ? `?keys=${keys.join(",")}` : "";

  return useQuery({
    queryKey: ["settings", keys],
    queryFn: async () => {
      const response = await apiClient<{ data: { settings: Record<string, any> } }>(`/admin/settings${queryParams}`);
      return response.data.settings;
    },
    enabled: Boolean((_hasHydrated ?? true) && token),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const response = await apiClient<{ data: { settings: Record<string, any> } }>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ settings }),
      });
      return response.data.settings;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["settings", undefined], data);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });

      const isShipping = "shipping" in variables;
      const isTaxes = "taxes" in variables;
      const title = isShipping
        ? "Shipping settings saved."
        : isTaxes
        ? "Tax settings saved."
        : "Settings saved successfully.";

      addToast({ title, type: "success" });
    },
    onError: (error: any) => {
      addToast({
        title: "Could not save settings. Please try again.",
        description: error?.message || "An error occurred while saving settings.",
        type: "error",
      });
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
    onError: (_error: any) => {
      addToast({
        title: "Failed to save email settings",
        description: "Failed to save email settings. Please try again.",
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
