import { prisma } from "@dashboard/database";

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: { name: { in: ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"] } } },
    select: { email: true, passwordHash: true, role: { select: { name: true } } }
  });
  console.log("Admin user in DB:", admin?.email, "Role:", admin?.role?.name, "Hash prefix:", admin?.passwordHash?.substring(0, 10));
  await prisma.$disconnect();
}
main().catch(console.error);
