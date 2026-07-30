"use client";

import { ThemeToggle, Button, useToast } from "@dashboard/ui";
import { LogOut } from "lucide-react";

import { AuthGuard } from "@/components/layout/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const handleLogout = () => {
    addToast({
      title: "Logged out",
      description: "Signed out of Admin Dashboard.",
      type: "info",
    });
    apiClient("/auth/logout", { method: "POST" }).finally(() => {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.assign("/login");
    });
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur-lg">
            <h1 className="text-lg font-semibold text-text-primary">Admin Portal</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-3 border-r border-border pr-4">
                <span className="text-sm font-medium text-text-secondary">
                  {user?.firstName} {user?.lastName}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-sm">
                  {user?.firstName?.[0] || "A"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-text-secondary hover:text-error"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 bg-background p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
