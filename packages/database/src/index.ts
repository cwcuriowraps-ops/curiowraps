export { prisma, connectPrisma } from "./client";
export { getDatabaseConfig } from "./env";

export type { DatabaseConfig } from "./env";
export type { Prisma, PrismaClient } from "@prisma/client";
export { ContactMessageStatus } from "@prisma/client";