import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("/Users/romit/Downloads/Dashboard/.env"), override: true });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Connecting to database to check RLS status...");
  
  // 1. Check all tables in public schema and their RLS status
  const tables: any[] = await prisma.$queryRaw`
    SELECT 
      c.relname AS tablename,
      c.relrowsecurity AS rowsecurity,
      c.relforcerowsecurity AS forcerowsecurity,
      r.rolname AS tableowner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
    ORDER BY c.relname ASC;
  `;
  
  console.log(`\nFound ${tables.length} tables in public schema:`);
  console.log("-------------------------------------------------------------------------------");
  console.log("Table Name".padEnd(35) + "RLS Enabled".padEnd(15) + "Force RLS".padEnd(15) + "Owner");
  console.log("-------------------------------------------------------------------------------");
  for (const t of tables) {
    console.log(
      t.tablename.padEnd(35) + 
      String(t.rowsecurity).padEnd(15) + 
      String(t.forcerowsecurity).padEnd(15) + 
      t.tableowner
    );
  }

  // 2. Check all policies in pg_policies
  const policies: any[] = await prisma.$queryRaw`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname ASC;
  `;
  
  console.log(`\n\nFound ${policies.length} policies in public schema:`);
  console.log("-------------------------------------------------------------------------------");
  for (const p of policies) {
    console.log(`Table: ${p.tablename} | Policy: ${p.policyname} | Cmd: ${p.cmd} | Roles: ${p.roles}`);
    console.log(`  Qual: ${p.qual}`);
    console.log(`  With Check: ${p.with_check}`);
  }

  // 3. Check table privileges for anon, authenticated, and public roles
  const privileges: any[] = await prisma.$queryRaw`
    SELECT 
      grantee, 
      table_name, 
      privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_schema = 'public' 
      AND grantee IN ('anon', 'authenticated', 'public')
    ORDER BY table_name, grantee, privilege_type;
  `;
  
  console.log(`\n\nTable privileges for anon, authenticated, public: ${privileges.length} records found`);
  const groupedPrivs: Record<string, Record<string, string[]>> = {};
  for (const row of privileges) {
    if (!groupedPrivs[row.table_name]) groupedPrivs[row.table_name] = {};
    if (!groupedPrivs[row.table_name][row.grantee]) groupedPrivs[row.table_name][row.grantee] = [];
    groupedPrivs[row.table_name][row.grantee].push(row.privilege_type);
  }
  for (const [tbl, grantees] of Object.entries(groupedPrivs)) {
    const info = Object.entries(grantees).map(([g, privs]) => `${g}: [${privs.join(",")}]`).join(" | ");
    console.log(`${tbl.padEnd(35)} -> ${info}`);
  }

  // 4. Check views in public schema
  const views: any[] = await prisma.$queryRaw`
    SELECT table_schema, table_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public';
  `;
  console.log(`\n\nViews in public schema: ${views.length}`);
  for (const v of views) {
    console.log(`View: ${v.table_name}`);
  }

  // 5. Check what user Prisma connects as
  const currentUser: any[] = await prisma.$queryRaw`
    SELECT current_user, session_user, current_database();
  `;
  console.log("\nCurrent DB User:", currentUser);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
