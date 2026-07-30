import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load the root .env file with override: true to bypass any system-injected env vars
dotenv.config({ path: path.resolve("/Users/romit/Downloads/Dashboard/.env"), override: true });

async function testConnection(label: string, databaseUrl: string, directUrl?: string) {
  console.log(`\n=== Testing connection for: ${label} ===`);
  console.log(`DATABASE_URL: ${databaseUrl}`);
  console.log(`DIRECT_URL: ${directUrl || "none"}`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    console.log("Connecting...");
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    const elapsed = Date.now() - start;
    console.log(`SUCCESS: connected in ${elapsed}ms`, result);
  } catch (err: any) {
    console.error("FAILURE connecting:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("process.env.DATABASE_URL:", process.env.DATABASE_URL);
  console.log("process.env.DIRECT_URL:", process.env.DIRECT_URL);
  console.log("process.env.BREVO_SMTP_PASS:", process.env.BREVO_SMTP_PASS ? "EXISTS" : "MISSING");

  const rootDatabaseUrl = process.env.DATABASE_URL || "";
  const rootDirectUrl = process.env.DIRECT_URL || "";

  // Test 1: Using the root .env variables
  await testConnection("Root .env configuration", rootDatabaseUrl, rootDirectUrl);

  // Test 2: Using the direct Supabase database URL (if we change host and port)
  const pooler5432 = rootDatabaseUrl.replace(":6543", ":5432").replace("?pgbouncer=true", "");
  await testConnection("Pooler host on Port 5432 (direct/session mode)", pooler5432);

  // Test 3: Direct Supabase host db.[ref].supabase.co on port 5432
  const match = rootDatabaseUrl.match(/postgres\.([^:@]+)[:@]/);
  if (match) {
    const projectRef = match[1];
    const directHostUrl = `postgresql://postgres:${encodeURIComponent("Sillycore123@")}@db.${projectRef}.supabase.co:5432/postgres`;
    await testConnection("Direct Supabase Host (db.[ref].supabase.co:5432)", directHostUrl);
  } else {
    console.log("Could not parse project reference from DATABASE_URL using regex.");
  }
}

main().catch(console.error);
