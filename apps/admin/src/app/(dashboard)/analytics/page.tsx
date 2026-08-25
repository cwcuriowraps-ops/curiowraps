"use client";

import { useDashboardStats } from "@/api/dashboard";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const totalRevenue = stats?.totalRevenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const totalProducts = stats?.totalProducts || 0;
  const totalCustomers = stats?.totalCustomers || 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Analytics Dashboard</h1>
      {isLoading ? (
        <div className="animate-pulse h-32 bg-muted rounded-lg w-full max-w-3xl" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-text-primary">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-text-primary">{totalOrders}</p>
          </div>
          <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Products</h3>
            <p className="text-3xl font-bold text-text-primary">{totalProducts}</p>
          </div>
          <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Total Customers</h3>
            <p className="text-3xl font-bold text-text-primary">{totalCustomers}</p>
          </div>
        </div>
      )}
    </div>
  );
}
