import { useAuthStore } from "../store/useAuthStore";

const getApiUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  if (url.startsWith("NEXT_PUBLIC_API_URL=")) {
    url = url.substring("NEXT_PUBLIC_API_URL=".length);
  }
  return url.replace(/\/+$/, "");
};

export const API_URL = getApiUrl();

interface RequestOptions extends globalThis.RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAutoRefresh?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

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

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const currentRefreshToken = useAuthStore.getState().refreshToken;
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refreshToken: currentRefreshToken || undefined }),
      });

      if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.assign("/login?expired=true");
        }
        return null;
      }

      if (!refreshResponse.ok) {
        return null;
      }

      const refreshPayload = await refreshResponse.json();
      const session = refreshPayload.data;
      if (session?.accessToken && session?.user) {
        useAuthStore.getState().setAuth(session.accessToken, session.user, session.refreshToken || currentRefreshToken);
        return session.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAutoRefresh, ...customConfig } = options;
  
  let url = `${API_URL}${endpoint}`;
  
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

  const isAuthEndpoint = ["/auth/login", "/auth/refresh", "/auth/logout"].includes(endpoint);

  // Proactive preemptive token refresh before sending request if token expires in < 60 seconds
  let currentToken = useAuthStore.getState().token;
  if (!isAuthEndpoint && !skipAutoRefresh && currentToken && isTokenExpiringOrExpired(currentToken, 60)) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      currentToken = refreshedToken;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customConfig.headers as Record<string, string>),
  };

  if (currentToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  const config: globalThis.RequestInit = {
    credentials: "include",
    ...customConfig,
    headers,
  };

  let response = await fetch(url, config);

  // Reactive 401 interceptor with silent retry
  if (response.status === 401 && !isAuthEndpoint) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(url, { ...config, headers });
    } else {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login?expired=true");
      }
    }
  }

  // Reactive 403 interceptor: token may have stale role/permissions, attempt one refresh
  if (response.status === 403 && !isAuthEndpoint && !skipAutoRefresh) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(url, { ...config, headers });
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

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
