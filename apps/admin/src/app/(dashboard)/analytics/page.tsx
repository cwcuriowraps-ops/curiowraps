"use client";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export default function AnalyticsPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders-analytics"],
    queryFn: () => apiClient<any>("/admin/orders")
  });

  const orderList = orders?.data?.orders || [];
  const totalRevenue = orderList.reduce((acc: number, o: any) => acc + Number(o.grandTotal || 0), 0);
  const totalOrders = orderList.length;

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
        </div>
      )}
    </div>
  );
}
