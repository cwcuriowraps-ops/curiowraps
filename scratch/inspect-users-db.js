import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env
const envPath = fs.existsSync('/Users/romit/Downloads/Dashboard/apps/api/.env') 
  ? '/Users/romit/Downloads/Dashboard/apps/api/.env'
  : path.resolve(process.cwd(), '.env');

const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

async function main() {
  const { prisma } = await import('@dashboard/database');

  console.log('=== ROLES IN DATABASE ===');
  const roles = await prisma.role.findMany({
    include: { _count: { select: { users: true } } }
  });
  console.log(JSON.stringify(roles, null, 2));

  console.log('\n=== ALL USERS IN DATABASE ===');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      deletedAt: true,
      roleId: true,
      role: { select: { name: true } },
      createdAt: true
    }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== DASHBOARD STATS QUERY TEST ===');
  const customerCountStrict = await prisma.user.count({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      role: { name: "CUSTOMER" }
    }
  });
  console.log('Strict Customer Count (role.name = CUSTOMER, deletedAt = null, status = ACTIVE):', customerCountStrict);

  const customerCountCaseInsensitive = await prisma.user.count({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      role: { name: { in: ["CUSTOMER", "Customer", "customer"] } }
    }
  });
  console.log('Case-insensitive Customer Count:', customerCountCaseInsensitive);

  const totalUserCount = await prisma.user.count();
  console.log('Total Users in table:', totalUserCount);

  await prisma.$disconnect();
}

main().catch(console.error);
