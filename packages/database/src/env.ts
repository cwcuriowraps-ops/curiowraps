export interface DatabaseConfig {
  url: string;
  directUrl?: string;
}

export function getDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const url = env.DATABASE_URL?.trim();

  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }

  const directUrl = env.DIRECT_URL?.trim();

  return {
    url,
    directUrl: directUrl ? directUrl : undefined,
  };
}