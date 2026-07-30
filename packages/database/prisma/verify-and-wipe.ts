import { PrismaClient } from "@prisma/client";

const DATABASE_URL = "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=15";
const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function verifyAndWipe() {
  console.log("Categories before wipe:", await prisma.category.count());
  console.log("Products before wipe:", await prisma.product.count());

  await prisma.category.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { not: "admin@curiowrap.com" } } });

  console.log("Categories after wipe:", await prisma.category.count());
  console.log("Products after wipe:", await prisma.product.count());
}

verifyAndWipe().finally(() => prisma.$disconnect());
