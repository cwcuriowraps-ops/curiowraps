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

  console.log('--- Cleaning up test/demo user accounts from past test runs ---');
  const deletedTestUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: '@example.com' } },
        { email: { startsWith: 'qa.user.' } },
        { email: { startsWith: 'test.' } },
        { email: { startsWith: 'e2e.' } },
      ]
    }
  });
  console.log(`Deleted ${deletedTestUsers.count} test user account(s).`);

  console.log('\n--- Remaining Active Storefront Customers ---');
  const activeCustomers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      role: { name: 'CUSTOMER' },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      role: { select: { name: true } }
    }
  });
  console.log(JSON.stringify(activeCustomers, null, 2));

  console.log(`\nVerified Customer Count: ${activeCustomers.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
