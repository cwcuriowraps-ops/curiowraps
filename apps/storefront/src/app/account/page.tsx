"use client";

import { useAuthStore } from "@/store/useAuthStore";

export default function AccountDashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-serif text-text-primary mb-4">
        Welcome back, {user.firstName}!
      </h1>
      <p className="text-text-secondary font-light">
        Here you can manage your recent orders, addresses, and account details.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <h3 className="font-serif text-xl text-text-primary mb-6">Profile Info</h3>
          <dl className="space-y-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-text-secondary font-medium">Name</dt>
              <dd className="font-medium text-text-primary mt-1 text-base">{user.firstName} {user.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-text-secondary font-medium">Email</dt>
              <dd className="font-medium text-text-primary mt-1 text-base">{user.email}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
