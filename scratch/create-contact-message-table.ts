import { PrismaClient } from "@prisma/client";

const dbUrl = "postgresql://postgres:Sillycore123%40@db.tggufvedwtpcxamkqihy.supabase.co:5432/postgres";
const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl },
  },
});

async function main() {
  console.log("Creating ContactMessage table & enum in Postgres...");

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ContactMessageStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED', 'ARCHIVED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ContactMessage" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "subject" TEXT,
        "message" TEXT NOT NULL,
        "status" "ContactMessageStatus" NOT NULL DEFAULT 'UNREAD',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ContactMessage_status_idx" ON "ContactMessage"("status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage"("email");`);

  console.log("✅ ContactMessage table and indices created successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
