export class RoleRepository {
  constructor(private readonly prisma: any) {}

  ensureCustomerRole() {
    return this.prisma.role.upsert({
      where: { name: "CUSTOMER" },
      create: {
        name: "CUSTOMER",
        isSystem: true,
      },
      update: {},
    });
  }
}
