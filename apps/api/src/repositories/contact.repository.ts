import type { PrismaClient } from "@dashboard/database";
import { ContactMessageStatus } from "@dashboard/database";

export interface ContactFilterOptions {
  status?: ContactMessageStatus | string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    return this.prisma.contactMessage.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        subject: data.subject?.trim() || null,
        message: data.message.trim(),
        status: ContactMessageStatus.UNREAD,
      },
    });
  }

  async findMany(options: ContactFilterOptions = {}) {
    const { status, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status as ContactMessageStatus;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.contactMessage.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: ContactMessageStatus) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.contactMessage.delete({
      where: { id },
    });
  }

  async countUnread() {
    return this.prisma.contactMessage.count({
      where: { status: ContactMessageStatus.UNREAD },
    });
  }
}
