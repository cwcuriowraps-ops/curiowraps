import { describe, expect, it } from "vitest";

import { getDatabaseConfig } from "../env";

describe("getDatabaseConfig", () => {
  it("accepts a PostgreSQL connection string", () => {
    const config = getDatabaseConfig({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public",
    });

    expect(config.url).toContain("postgresql://");
    expect(config.directUrl).toBeUndefined();
  });

  it("rejects missing connection strings", () => {
    expect(() => getDatabaseConfig({})).toThrow("DATABASE_URL is required.");
  });

  it("rejects non-PostgreSQL connection strings", () => {
    expect(() =>
      getDatabaseConfig({ DATABASE_URL: "mysql://root:root@localhost:3306/ecommerce" }),
    ).toThrow("DATABASE_URL must be a PostgreSQL connection string.");
  });
});