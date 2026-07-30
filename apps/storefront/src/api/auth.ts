import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: any) => {
      const response = await apiClient<{ data?: { user: any; accessToken: string; refreshToken?: string }; user?: any; accessToken?: string; refreshToken?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const authData = response?.data || response;
      return {
        user: authData?.user,
        accessToken: authData?.accessToken,
        refreshToken: authData?.refreshToken,
      };
    },
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        setAuth(data.accessToken, data.user, data.refreshToken);
        router.push("/account");
      }
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiClient<{ data?: { user: any; accessToken: string; refreshToken?: string }; user?: any; accessToken?: string; refreshToken?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      const authData = response?.data || response;
      return {
        user: authData?.user,
        accessToken: authData?.accessToken,
        refreshToken: authData?.refreshToken,
      };
    },
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        setAuth(data.accessToken, data.user, data.refreshToken);
        router.push("/account");
      }
    },
  });
};

export const useOAuthLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ provider, idToken }: { provider: "GOOGLE" | "APPLE"; idToken: string }) => {
      const response = await apiClient<{ data?: { user: any; accessToken: string; refreshToken?: string }; user?: any; accessToken?: string; refreshToken?: string }>("/auth/oauth", {
        method: "POST",
        body: JSON.stringify({ provider, idToken }),
      });
      const authData = response?.data || response;
      return {
        user: authData?.user,
        accessToken: authData?.accessToken,
        refreshToken: authData?.refreshToken,
      };
    },
    onSuccess: (data) => {
      if (data.accessToken && data.user) {
        setAuth(data.accessToken, data.user, data.refreshToken);
        router.push("/account");
      }
    },
  });
};

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient("/auth/logout", {
      method: "POST",
    }),
    onSettled: () => {
      queryClient.clear();
      logout();
      router.push("/auth/login");
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => apiClient<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => apiClient<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });
};
