import { prisma } from "@dashboard/database";

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true },
  });
  console.log("Users:", users.map(u => ({ id: u.id, email: u.email, role: u.role?.name })));

  const roles = await prisma.role.findMany();
  console.log("Roles:", roles.map(r => ({ id: r.id, name: r.name })));
  await prisma.$disconnect();
}

main().catch(console.error);
