export { prisma, connectPrisma } from "./client.js";
export { getDatabaseConfig } from "./env.js";

export type { DatabaseConfig } from "./env.js";
export type { Prisma, PrismaClient } from "@prisma/client";
export { ContactMessageStatus } from "@prisma/client";