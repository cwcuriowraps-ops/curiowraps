"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/useAuthStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !_hasHydrated) return;

    if (!user && !pathname.startsWith("/login")) {
      router.push("/login");
    } else if (user && pathname.startsWith("/login")) {
      router.push("/");
    }
  }, [user, router, pathname, isMounted, _hasHydrated]);

  if (!isMounted || !_hasHydrated) {
    return null;
  }

  // Prevent flashing protected content before redirecting
  if (!user && !pathname.startsWith("/login")) {
    return null;
  }

  return <>{children}</>;
}
