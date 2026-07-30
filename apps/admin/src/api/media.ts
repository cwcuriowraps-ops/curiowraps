import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { API_URL, apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useAdminMedia = (params: Record<string, any>) => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["admin-media", params],
    queryFn: async () => {
      return apiClient<{ data: { media: any[] }; meta?: any }>("/admin/media", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
    },
    enabled: !!token,
  });
};

async function doUploadFetch(file: File, accessToken: string | null): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/admin/media/upload`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: "include",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Upload request timed out after 30 seconds. Please check your network and try again.");
    }
    throw err;
  }
}

export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Always read the latest token from the store at call time (not from stale closure)
      let token = useAuthStore.getState().token;

      let response = await doUploadFetch(file, token);

      // If the access token expired, try to refresh it once and retry
      if (response.status === 401) {
        const refreshToken = useAuthStore.getState().refreshToken;
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refreshToken: refreshToken || undefined }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const session = refreshData.data;
            if (session?.accessToken && session?.user) {
              useAuthStore.getState().setAuth(
                session.accessToken,
                session.user,
                session.refreshToken || refreshToken,
              );
              token = session.accessToken;
              // Retry the upload with the new token
              response = await doUploadFetch(file, token);
            }
          }
        } catch {
          // refresh failed — fall through to the error handler below
        }
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error?.message ||
          `Upload failed (HTTP ${response.status})`,
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
  });
};

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient(`/admin/media/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
  });
};
