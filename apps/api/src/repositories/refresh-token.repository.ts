import type { Prisma } from "@dashboard/database";

export class RefreshTokenRepository {
  constructor(private readonly prisma: any) {}

  findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });
  }

  create(data: Prisma.RefreshTokenCreateInput) {
    return this.prisma.refreshToken.create({ data });
  }

  revokeById(id: string, revokedAt: Date, replacementId?: string) {
    return this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: {
        revokedAt,
        replacedByTokenId: replacementId,
        lastUsedAt: revokedAt,
      },
    });
  }

  revokeByHash(tokenHash: string, revokedAt: Date) {
    return this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt, lastUsedAt: revokedAt },
    });
  }

  deleteByHash(tokenHash: string) {
    return this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
}
