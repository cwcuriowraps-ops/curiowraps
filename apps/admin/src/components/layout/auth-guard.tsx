"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/useAuthStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !_hasHydrated) return;

    const isLoginPage = pathname.startsWith("/login");
    const isAdmin = Boolean(user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN"));

    if (!user && !isLoginPage) {
      router.push("/login");
    } else if (user && !isAdmin && !isLoginPage) {
      logout();
      router.push("/login?unauthorized=true");
    } else if (user && isAdmin && isLoginPage) {
      router.push("/");
    }
  }, [user, router, pathname, isMounted, _hasHydrated, logout]);

  if (!isMounted || !_hasHydrated) {
    return null;
  }

  const isLoginPage = pathname.startsWith("/login");
  const isAdmin = Boolean(user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN"));

  // Prevent flashing protected content before redirecting
  if ((!user || !isAdmin) && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
