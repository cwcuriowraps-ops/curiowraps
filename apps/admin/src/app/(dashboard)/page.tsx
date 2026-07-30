"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@dashboard/ui";
import { format } from "date-fns";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

const RevenueChart = dynamic(() => import("@/components/dashboard/RevenueChart"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted rounded-xl" />,
});

import { useDashboardStats } from "@/api/dashboard";
import { API_URL } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
export default function AdminDashboard() {
  const { data: initialData, isLoading } = useDashboardStats();
  const { token } = useAuthStore();
  
  const [realtimeStats, setRealtimeStats] = useState<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  } | null>(null);

  useEffect(() => {
    if (!token) return;

    // Connect to SSE for real-time events
    const eventSource = new EventSource(`${API_URL}/admin/system/events?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "stats") {
          setRealtimeStats(payload.data);
        }
      } catch (error) {
        console.error("Failed to parse SSE event", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  const displayData = {
    totalRevenue: realtimeStats?.totalRevenue ?? initialData?.totalRevenue ?? 0,
    totalOrders: realtimeStats?.totalOrders ?? initialData?.totalOrders ?? 0,
    totalCustomers: realtimeStats?.totalCustomers ?? initialData?.totalCustomers ?? 0,
    totalProducts: realtimeStats?.totalProducts ?? initialData?.totalProducts ?? 0,
    chartData: initialData?.chartData || [],
    recentOrders: initialData?.recentOrders || [],
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Revenue", value: `₹${displayData.totalRevenue.toLocaleString()}` },
    { label: "Orders", value: displayData.totalOrders.toLocaleString() },
    { label: "Customers", value: displayData.totalCustomers.toLocaleString() },
    { label: "Products", value: displayData.totalProducts.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
        <p className="mt-1 text-text-secondary">
          Here&apos;s an overview of your store performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-secondary">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                <p className="mt-1 text-xs text-text-secondary text-green-500">Live</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <RevenueChart data={displayData.chartData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {displayData.recentOrders.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-text-secondary">
                No recent orders found.
              </div>
            ) : (
              <ul className="space-y-4">
                {displayData.recentOrders.map((order: any) => (
                  <li key={order.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-muted text-xs font-bold text-text-primary">
                        {format(new Date(order.createdAt), "dd")}
                        <span className="text-[10px] font-normal text-text-secondary uppercase">
                          {format(new Date(order.createdAt), "MMM")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-text-secondary">{order.items?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-text-primary">₹{order.grandTotal}</span>
                      <Badge variant={order.status === "PENDING" ? "warning" : "default"}>
                        {order.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
