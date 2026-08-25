let cachedCustomerRole: any = null;

export class RoleRepository {
  constructor(private readonly prisma: any) {}

  async ensureCustomerRole() {
    if (cachedCustomerRole) {
      return cachedCustomerRole;
    }

    const role = await this.prisma.role.upsert({
      where: { name: "CUSTOMER" },
      create: {
        name: "CUSTOMER",
        isSystem: true,
      },
      update: {},
    });

    cachedCustomerRole = role;
    return role;
  }
}
