import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:Sillycore123%40@db.tggufvedwtpcxamkqihy.supabase.co:5432/postgres",
    },
  },
});

async function main() {
  const hash = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.update({
    where: { email: "admin@curiowrap.com" },
    data: { passwordHash: hash, status: "ACTIVE" },
  });
  console.log("Updated admin password for:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
