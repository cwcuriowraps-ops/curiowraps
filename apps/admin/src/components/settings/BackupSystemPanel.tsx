"use client";

import { Button, Card, CardHeader, CardTitle, CardContent, useToast } from "@dashboard/ui";
import { useQuery } from "@tanstack/react-query";
import { Download, Database, HardDrive, Server } from "lucide-react";

import { API_URL, apiClient } from "../../lib/api-client";
import { useAuthStore } from "../../store/useAuthStore";

export function BackupSystemPanel() {
  const { token } = useAuthStore();
  const { addToast } = useToast();

  const { data: status } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      const response = await apiClient<{ data: any }>("/admin/system/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleExport = async (type: string) => {
    try {
      addToast({ title: "Download Started", description: `Downloading ${type} CSV backup...`, type: "info" });
      const response = await fetch(`${API_URL}/admin/system/export?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Export request failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-backup.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      addToast({
        title: "Export Failed",
        description: "Export failed. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-surface p-4 flex flex-col items-center text-center">
              <HardDrive className="h-6 w-6 text-text-secondary mb-2" />
              <p className="text-sm font-medium text-text-primary">Database</p>
              <p className="text-xs text-green-500 mt-1">{status?.database?.status || "Checking..."}</p>
              <p className="text-xs text-text-secondary mt-1">{status?.database?.latency || "-"}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 flex flex-col items-center text-center">
              <Database className="h-6 w-6 text-text-secondary mb-2" />
              <p className="text-sm font-medium text-text-primary">Redis Cache</p>
              <p className={`text-xs mt-1 ${status?.redis?.status === "Connected" ? "text-green-500" : "text-yellow-500"}`}>
                {status?.redis?.status || "Checking..."}
              </p>
              <p className="text-xs text-text-secondary mt-1">{status?.redis?.latency || "-"}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4 flex flex-col items-center text-center">
              <Server className="h-6 w-6 text-text-secondary mb-2" />
              <p className="text-sm font-medium text-text-primary">App Version</p>
              <p className="text-xs text-text-secondary mt-1">v{status?.version || "1.0.0"}</p>
              <p className="text-xs text-text-secondary mt-1">Uptime: {status?.uptime ? Math.round(status.uptime / 60) : 0} mins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h4 className="font-medium text-text-primary">Products Backup</h4>
              <p className="text-sm text-text-secondary">Download all products and variants as CSV.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport("products")}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h4 className="font-medium text-text-primary">Orders Backup</h4>
              <p className="text-sm text-text-secondary">Download complete order history as CSV.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport("orders")}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-text-primary">Customers Backup</h4>
              <p className="text-sm text-text-secondary">Download customer details and roles.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleExport("customers")}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
