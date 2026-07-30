import type { PrismaClient } from "@dashboard/database";

export class SettingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.setting.findMany();
  }

  async findByKeys(keys: string[]) {
    return this.prisma.setting.findMany({
      where: { key: { in: keys } },
    });
  }

  async findByKey(key: string) {
    return this.prisma.setting.findFirst({
      where: { key },
    });
  }

  async upsert(key: string, value: any, updatedByUserId?: string, scope: string = "global") {
    const existing = await this.prisma.setting.findFirst({ where: { key } });
    if (existing) {
      return this.prisma.setting.update({
        where: { id: existing.id },
        data: {
          value: value as any,
          updatedByUserId,
          scope,
        },
      });
    }

    return this.prisma.setting.create({
      data: {
        key,
        value: value as any,
        updatedByUserId,
        scope,
      },
    });
  }

  async bulkUpsert(settings: { key: string; value: any; scope?: string }[], updatedByUserId?: string) {
    const results = [];
    for (const setting of settings) {
      const res = await this.upsert(setting.key, setting.value, updatedByUserId, setting.scope);
      results.push(res);
    }
    return results;
  }
}
