import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/useAuthStore";

export const useDashboardStats = () => {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await apiClient<{ data: any }>("/admin/system/dashboard", { headers }).catch(() => null);

      if (!response?.data) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          chartData: [
            { name: "Mon", revenue: 0 },
            { name: "Tue", revenue: 0 },
            { name: "Wed", revenue: 0 },
            { name: "Thu", revenue: 0 },
            { name: "Fri", revenue: 0 },
          ],
          recentOrders: [],
        };
      }

      return {
        totalRevenue: response.data.totalRevenue,
        totalOrders: response.data.totalOrders,
        totalProducts: response.data.totalProducts,
        totalCustomers: response.data.totalCustomers,
        chartData: response.data.chartData?.length > 0 ? response.data.chartData : [
          { name: "Mon", revenue: 0 },
          { name: "Tue", revenue: 0 },
          { name: "Wed", revenue: 0 },
          { name: "Thu", revenue: 0 },
          { name: "Fri", revenue: 0 },
        ],
        recentOrders: response.data.recentOrders || [],
      };
    },
    enabled: !!token,
  });
};
