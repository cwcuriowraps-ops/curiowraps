import type { Prisma, PrismaClient } from "@dashboard/database";

export class ShippingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Zones
  async findAllZones() {
    return this.prisma.shippingZone.findMany({
      include: {
        methods: {
          include: {
            rates: true
          }
        }
      } as any
    });
  }

  async findZoneById(id: string) {
    return this.prisma.shippingZone.findUnique({
      where: { id },
      include: {
        methods: {
          include: {
            rates: true
          }
        }
      } as any
    });
  }

  async createZone(data: Prisma.ShippingZoneCreateInput) {
    return this.prisma.shippingZone.create({ data });
  }

  async updateZone(id: string, data: Prisma.ShippingZoneUpdateInput) {
    return this.prisma.shippingZone.update({ where: { id }, data });
  }

  async deleteZone(id: string) {
    return this.prisma.shippingZone.delete({ where: { id } });
  }

  // Methods
  async createMethod(data: Prisma.ShippingMethodCreateInput) {
    return this.prisma.shippingMethod.create({ data });
  }

  async updateMethod(id: string, data: Prisma.ShippingMethodUpdateInput) {
    return this.prisma.shippingMethod.update({ where: { id }, data });
  }

  async deleteMethod(id: string) {
    return this.prisma.shippingMethod.delete({ where: { id } });
  }

  // Rates
  async createRate(data: Prisma.ShippingRateCreateInput) {
    return this.prisma.shippingRate.create({ data });
  }

  async updateRate(id: string, data: Prisma.ShippingRateUpdateInput) {
    return this.prisma.shippingRate.update({ where: { id }, data });
  }

  async deleteRate(id: string) {
    return this.prisma.shippingRate.delete({ where: { id } });
  }
}
