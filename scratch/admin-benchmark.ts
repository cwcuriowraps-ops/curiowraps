import { prisma } from "@dashboard/database";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const API_BASE = "http://localhost:4000/api/v1";

async function main() {
  console.log("=== CURIO WRAP ADMIN BENCHMARK ===");

  const adminUser = await prisma.user.findFirst({
    where: { role: { name: "ADMIN" } },
    include: { role: true },
  });

  if (!adminUser) {
    console.error("No admin user found in database");
    await prisma.$disconnect();
    return;
  }

  const secret = "d7357d704eab4c79c5d29b0fff9b08bc882ef99d3d47aa40efc2cd12e44ea91e";
  console.log(`Using admin: ${adminUser.email}`);

  const token = jwt.sign(
    {
      sub: adminUser.id,
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role.name,
      tokenType: "access",
      jti: randomUUID(),
    },
    secret,
    { expiresIn: "1h" }
  );

  const endpoints = [
    { name: "Dashboard Stats", url: "/admin/system/dashboard" },
    { name: "Products List", url: "/admin/products?page=1&limit=10" },
    { name: "Categories List", url: "/admin/categories" },
    { name: "Collections / Brands", url: "/admin/brands" },
    { name: "Media Library", url: "/admin/media?page=1&limit=24" },
    { name: "Orders List", url: "/admin/orders?page=1&limit=15" },
    { name: "Customers / Users", url: "/admin/users?page=1&limit=15" },
    { name: "Inventory List", url: "/admin/inventory?page=1&limit=20" },
    { name: "Settings", url: "/admin/settings" },
    { name: "Unread Messages", url: "/admin/contact-messages/unread-count" },
  ];

  console.log("\n=== RUNNING 3-SAMPLE LATENCY & SIZE BENCHMARK ===");
  console.log("| Page / Endpoint | Status | Avg Latency | Min | Max | Response Size |");
  console.log("|---|---|---|---|---|---|");

  for (const ep of endpoints) {
    const latencies: number[] = [];
    let size = 0;
    let status = 0;

    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      try {
        const res = await fetch(`${API_BASE}${ep.url}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const duration = performance.now() - start;
        latencies.push(duration);
        status = res.status;
        const text = await res.text();
        size = text.length;
      } catch (err: any) {
        console.error(`Error requesting ${ep.url}:`, err.message);
      }
    }

    const avg = latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0) : "ERR";
    const min = latencies.length ? Math.min(...latencies).toFixed(0) : "ERR";
    const max = latencies.length ? Math.max(...latencies).toFixed(0) : "ERR";

    console.log(`| ${ep.name} (\`${ep.url}\`) | ${status} | ${avg}ms | ${min}ms | ${max}ms | ${(size / 1024).toFixed(2)} KB |`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
