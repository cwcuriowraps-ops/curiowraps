import type { Prisma, PrismaClient } from "@dashboard/database";

export class AttributeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(includeInactive = false) {
    return this.prisma.attribute.findMany({
      where: { ...(includeInactive ? {} : { isActive: true }) },
      include: { values: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.prisma.attribute.findUnique({
      where: { id },
      include: { values: true },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.attribute.findUnique({ where: { slug }, include: { values: true } });
  }

  async create(data: Prisma.AttributeCreateInput) {
    return this.prisma.attribute.create({ data });
  }

  async update(id: string, data: Prisma.AttributeUpdateInput) {
    return this.prisma.attribute.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.attribute.delete({ where: { id } });
  }

  // Value Operations
  async addValue(attributeId: string, data: { value: string; sortOrder?: number }) {
    return this.prisma.attributeValue.create({
      data: { ...data, attributeId },
    });
  }

  async removeValue(attributeValueId: string) {
    return this.prisma.attributeValue.delete({
      where: { id: attributeValueId },
    });
  }
}
