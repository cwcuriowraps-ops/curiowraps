import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Explicit datasource override ensures the URL from process.env is used,
    // not a stale value baked in at build time.
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Call this once at server startup to eagerly warm the connection pool.
 * Without this, Prisma uses lazy-connect and the first request under
 * Supabase pgBouncer Transaction Mode (port 6543) can time out.
 */
export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    console.info("[Prisma] Connection pool warmed successfully");
  } catch (err) {
    console.error("[Prisma] Failed to warm connection pool at startup:", err);
    // Don't crash the process — let individual requests fail with clear errors
  }
}