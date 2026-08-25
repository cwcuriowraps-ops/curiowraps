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
    return this.prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: value as any,
        updatedByUserId,
        scope,
      },
      update: {
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
