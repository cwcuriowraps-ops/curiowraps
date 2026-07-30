const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 12);
  const user = await prisma.user.update({
    where: { email: 'admin@curiowrap.local' },
    data: { passwordHash: hash }
  });
  console.log('Password updated for:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
