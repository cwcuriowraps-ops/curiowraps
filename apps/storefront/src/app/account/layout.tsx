"use client";

import { Button, useToast } from "@dashboard/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useLogout } from "@/api/auth";
import { sanitizeErrorMessage } from "@/lib/toast-utils";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Order History" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const logoutMutation = useLogout();
  const { addToast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !_hasHydrated) return;
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router, isMounted, _hasHydrated]);

  if (!isMounted || !_hasHydrated || !user) return null;

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onError: (err: any) => {
        addToast({
          title: "Logout Failed",
          description: sanitizeErrorMessage(err, "Could not sign out. Please try again."),
          type: "error",
        });
      },
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:gap-12 md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between md:block">
                <h2 className="text-lg sm:text-xl font-serif text-text-primary">My Account</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg px-2.5 h-8"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "..." : "Log Out"}
                </Button>
              </div>
              <nav className="mt-3 sm:mt-6 flex flex-row overflow-x-auto no-scrollbar md:flex-col gap-1.5 sm:gap-2 pb-1 md:pb-0">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-colors shrink-0 whitespace-nowrap md:shrink ${
                      pathname === item.href
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-text-secondary hover:bg-muted hover:text-text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="hidden md:block mt-8 border-t border-border pt-6">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-8 md:p-10 shadow-sm">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
