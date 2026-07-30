import type { PrismaClient } from "@dashboard/database";
import type { Request, Response } from "express";

import type { RedisService } from "../services/redis.service";

export interface AdminSystemControllerDeps {
  prisma: PrismaClient;
  redisService: RedisService;
}

export function createAdminSystemController(deps: AdminSystemControllerDeps) {
  return {
    getStatus: async (req: Request, res: Response) => {
      try {
        // Postgres Status
        const dbStart = Date.now();
        await deps.prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - dbStart;

        // Redis Status
        const redisStart = Date.now();
        const redisClient = deps.redisService.getClient();
        let redisStatus = "Disconnected";
        let redisLatency = 0;
        
        if (redisClient) {
          await redisClient.ping();
          redisLatency = Date.now() - redisStart;
          redisStatus = "Connected";
        } else {
          redisStatus = "Disabled (Local Development)";
        }

        res.json({
          success: true,
          data: {
            database: {
              status: "Connected",
              latency: `${dbLatency}ms`,
            },
            redis: {
              status: redisStatus,
              latency: redisClient ? `${redisLatency}ms` : "N/A",
            },
            uptime: process.uptime(),
            version: process.env.npm_package_version || "1.0.0",
          },
        });
      } catch {
        res.status(500).json({ success: false, error: "System check failed" });
      }
    },

    exportData: async (req: Request, res: Response) => {
      const type = req.query.type as string;
      if (!type || !["products", "orders", "customers"].includes(type)) {
        return res.status(400).json({ success: false, error: "Invalid export type" });
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${type}_export_${new Date().toISOString()}.csv"`);

      if (type === "products") {
        const products = await deps.prisma.product.findMany({ include: { variants: true } });
        res.write("ID,Name,Status,Price\n");
        products.forEach(p => {
          const price = p.variants[0]?.price || 0;
          res.write(`${p.id},"${p.name}",${p.status},${price}\n`);
        });
      } else if (type === "orders") {
        const orders = await deps.prisma.order.findMany();
        res.write("ID,OrderNumber,Status,Total\n");
        orders.forEach(o => {
          res.write(`${o.id},${o.orderNumber},${o.status},${o.grandTotal}\n`);
        });
      } else if (type === "customers") {
        const users = await deps.prisma.user.findMany();
        res.write("ID,FirstName,LastName,Email,Role\n");
        users.forEach(u => {
          res.write(`${u.id},${u.firstName},${u.lastName},${u.email},${u.roleId}\n`);
        });
      }

      res.end();
    },

    dashboardStats: async (req: Request, res: Response) => {
      try {
        const customerWhere = {
          deletedAt: null,
          status: "ACTIVE" as const,
          role: { name: "CUSTOMER" },
          email: { not: { endsWith: "@example.com" } },
          AND: [
            { email: { not: { startsWith: "qa.user." } } },
            { email: { not: { startsWith: "test." } } },
            { email: { not: { startsWith: "e2e." } } },
          ],
        };

        const [totalOrders, totalProducts, totalCustomers, totalRevenueData, recentOrders] = await Promise.all([
          deps.prisma.order.count({ where: { status: { not: "CANCELLED" }, deletedAt: null } }),
          deps.prisma.product.count({ where: { deletedAt: null } }),
          // Accurate Live Customers count:
          deps.prisma.user.count({ where: customerWhere }),
          deps.prisma.order.aggregate({
            _sum: { grandTotal: true },
            where: { status: { not: "CANCELLED" }, deletedAt: null }
          }),
          deps.prisma.order.findMany({
            take: 5,
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
          })
        ]);

        const allOrders = await deps.prisma.order.findMany({
          where: { status: { not: "CANCELLED" }, deletedAt: null },
          select: { createdAt: true, grandTotal: true }
        });

        const revenueByDate: Record<string, number> = {};
        allOrders.forEach((order) => {
          const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.grandTotal);
        });

        const chartData = Object.entries(revenueByDate).map(([name, revenue]) => ({ name, revenue }));
        chartData.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

        res.json({
          success: true,
          data: {
            totalOrders,
            totalProducts,
            totalCustomers,
            totalRevenue: Number(totalRevenueData._sum.grandTotal || 0),
            chartData,
            recentOrders
          }
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        res.status(500).json({ success: false, error: "Failed to fetch dashboard stats" });
      }
    },

    events: async (req: Request, res: Response) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // Send initial data immediately
      const sendStats = async () => {
        try {
          const customerWhere = {
            deletedAt: null,
            status: "ACTIVE" as const,
            role: { name: "CUSTOMER" },
            email: { not: { endsWith: "@example.com" } },
            AND: [
              { email: { not: { startsWith: "qa.user." } } },
              { email: { not: { startsWith: "test." } } },
              { email: { not: { startsWith: "e2e." } } },
            ],
          };

          const totalOrders = await deps.prisma.order.count({ where: { status: { not: "CANCELLED" }, deletedAt: null } });
          const totalProducts = await deps.prisma.product.count({ where: { deletedAt: null } });
          const totalCustomers = await deps.prisma.user.count({ where: customerWhere });
          
          const revenueData = await deps.prisma.order.aggregate({
            _sum: { grandTotal: true },
            where: { status: { not: "CANCELLED" }, deletedAt: null }
          });
          const totalRevenue = Number(revenueData._sum.grandTotal || 0);

          res.write(`data: ${JSON.stringify({ type: "stats", data: { totalOrders, totalProducts, totalCustomers, totalRevenue } })}\n\n`);
        } catch (error) {
          console.error("Error sending initial stats:", error);
        }
      };

      await sendStats();

      // Set up Redis subscription for real-time updates
      const subscriber = deps.redisService.getClient()?.duplicate();
      if (subscriber) {
        await subscriber.connect().catch(console.error);
        await subscriber.subscribe("admin:events", (message) => {
          res.write(`data: ${message}\n\n`);
        }).catch(console.error);
      }

      // Interval to keep connection alive
      const interval = setInterval(() => {
        res.write(": keepalive\n\n");
      }, 30000);

      req.on("close", () => {
        clearInterval(interval);
        if (subscriber) {
          subscriber.unsubscribe().catch(console.error);
          subscriber.quit().catch(console.error);
        }
      });
    },
  };
}
