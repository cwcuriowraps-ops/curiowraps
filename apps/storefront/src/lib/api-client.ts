export const getApiUrl = (rawUrl?: string): string => {
  let url = rawUrl !== undefined ? rawUrl : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1");
  if (url.startsWith("NEXT_PUBLIC_API_URL=")) {
    url = url.substring("NEXT_PUBLIC_API_URL=".length);
  }
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api/v1")) {
    url += "/api/v1";
  }
  return url;
};

export const API_URL = getApiUrl();

import { useAuthStore } from "../store/useAuthStore";

interface RequestOptions extends globalThis.RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

let refreshPromise: Promise<string> | null = null;

export function isTokenExpiringOrExpired(token: string | null, bufferSeconds = 60): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[1]) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp - currentTime < bufferSeconds;
  } catch {
    return true;
  }
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const { setAuth, logout } = useAuthStore.getState();
  const currentRefreshToken = useAuthStore.getState().refreshToken;

  refreshPromise = fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ refreshToken: currentRefreshToken || undefined }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Refresh failed");
      const refreshData = await res.json();
      const newAccessToken = refreshData.data.accessToken;
      setAuth(newAccessToken, refreshData.data.user, refreshData.data.refreshToken || currentRefreshToken);
      return newAccessToken;
    })
    .catch((err) => {
      logout();
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (currentPath.startsWith("/account") || currentPath.startsWith("/checkout")) {
          window.location.href = "/auth/login?expired=true";
        }
      }
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...customConfig } = options;
  
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let url = `${API_URL}${cleanEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const isAuthEndpoint = ["/auth/login", "/auth/refresh", "/auth/oauth", "/auth/register"].includes(endpoint);

  let currentToken = useAuthStore.getState().token;
  if (!isAuthEndpoint && currentToken && isTokenExpiringOrExpired(currentToken, 60)) {
    try {
      currentToken = await refreshAccessToken();
    } catch {
      // Ignore preemptive refresh failure, let request try or hit reactive 401 handler
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customConfig.headers as Record<string, string>),
  };

  if (currentToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${currentToken}`;
  }

  const config: globalThis.RequestInit = {
    credentials: "include",
    ...customConfig,
    headers,
  };

  let response = await fetch(url, config);

  if (response.status === 401 && !isAuthEndpoint) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;
      config.headers = headers;
      response = await fetch(url, config);
    } catch {
      // Refresh failed, error will be handled below
    }
  }

  if (!response.ok) {
    let error: Error & { status?: number; code?: string; data?: any };
    try {
      const data = await response.json();
      error = new Error(data.error?.message || data.message || "An error occurred");
      error.status = response.status;
      error.code = data.error?.code || data.code || "API_ERROR";
      error.data = data;
    } catch {
      error = new Error(response.statusText || "HTTP Error");
      error.status = response.status;
      error.code = "HTTP_ERROR";
    }
    throw error;
  }

  return (await response.json()) as T;
}
