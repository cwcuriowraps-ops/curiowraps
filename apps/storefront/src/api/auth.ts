import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";
import { useBuyNowStore } from "../store/useBuyNowStore";
import { useGuestCartStore } from "../store/useGuestCartStore";

async function syncGuestCartAndRedirect(
  router: any,
  queryClient: any,
  token: string,
  searchParams?: URLSearchParams | null
) {
  // 1. Synchronize guest cart if items exist
  const guestCart = useGuestCartStore.getState();
  if (guestCart.items && guestCart.items.length > 0) {
    try {
      for (const item of guestCart.items) {
        await apiClient("/cart/items", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            variantId: item.variantId,
            quantity: item.quantity,
            customization: item.customization,
          }),
        });
      }
      guestCart.clearCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (err) {
      console.error("Failed to synchronize guest cart:", err);
    }
  }

  // 2. Check intended redirect destination
  const redirectParam =
    searchParams?.get?.("redirect") ||
    (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null);
  const buyNowItem = useBuyNowStore.getState().item;

  if (redirectParam && redirectParam.includes("buyNow=true") && buyNowItem) {
    router.push("/checkout?buyNow=true");
    return;
  }

  if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/auth")) {
    router.push(redirectParam);
    return;
  }

  router.push("/account");
}

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

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
    onSuccess: async (data) => {
      if (data.accessToken && data.user) {
        setAuth(data.accessToken, data.user, data.refreshToken);
        await syncGuestCartAndRedirect(router, queryClient, data.accessToken);
      }
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

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
    onSuccess: async (data) => {
      if (data.accessToken && data.user) {
        setAuth(data.accessToken, data.user, data.refreshToken);
        await syncGuestCartAndRedirect(router, queryClient, data.accessToken);
      }
    },
  });
};

export const useOAuthLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

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
    onSuccess: async (data) => {
      if (data.accessToken && data.user) {
        setAuth(data.accessToken, data.user, data.refreshToken);
        await syncGuestCartAndRedirect(router, queryClient, data.accessToken);
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
