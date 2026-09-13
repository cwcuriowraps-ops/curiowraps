import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { fileURLToPath } from "url";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDirectUrl(): string {
  const base = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}connection_limit=1&connect_timeout=60&pool_timeout=60`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDirectUrl(),
    },
  },
});

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (!inDollarQuote && !inLineComment && !inBlockComment) {
      if (char === "-" && nextChar === "-") {
        inLineComment = true;
        current += char;
        continue;
      }
      if (char === "/" && nextChar === "*") {
        inBlockComment = true;
        current += char;
        continue;
      }
      if (char === "$" && nextChar === "$") {
        inDollarQuote = true;
        current += "$$";
        i++;
        continue;
      }
      if (char === ";") {
        const trimmed = current.trim();
        // Ignore comment-only statements
        const nonComment = trimmed
          .replace(/--.*$/gm, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .trim();
        if (nonComment.length > 0) {
          statements.push(trimmed);
        }
        current = "";
        continue;
      }
    } else if (inDollarQuote) {
      if (char === "$" && nextChar === "$") {
        inDollarQuote = false;
        current += "$$";
        i++;
        continue;
      }
    } else if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
    } else if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        current += "*/";
        i++;
        continue;
      }
    }

    current += char;
  }

  const remaining = current.trim();
  const nonComment = remaining
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
  if (nonComment.length > 0) {
    statements.push(remaining);
  }

  return statements;
}

async function main() {
  const sqlPath = path.resolve(
    __dirname,
    "migrations/20260912_supabase_security_rls/migration.sql"
  );
  console.log(`[Migration] Reading SQL migration from: ${sqlPath}`);
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const statements = splitSqlStatements(sql);
  console.log(`[Migration] Found ${statements.length} real statements to execute.`);

  console.log("[Migration] Applying migration to Supabase PostgreSQL database...");
  const start = Date.now();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.split("\n").filter(l => !l.trim().startsWith("--"))[0]?.slice(0, 70) || "";
    
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.$executeRawUnsafe(stmt);
        console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          console.error(`[${i + 1}/${statements.length}] FAILED after retries: ${preview}...`, err.message);
          throw err;
        }
        console.warn(`[${i + 1}/${statements.length}] Retry ${3 - retries}/3 for: ${preview}...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  const duration = Date.now() - start;
  console.log(`\n[Migration] Migration applied successfully in ${duration}ms!`);
}

main()
  .catch((err) => {
    console.error("[Migration] Failed to apply migration:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
