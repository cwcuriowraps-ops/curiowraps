import { PrismaClient, Payment, Prisma, PaymentStatus, OrderStatus } from "@prisma/client";

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return this.prisma.payment.create({
      data,
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByProviderOrderId(providerOrderId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { providerOrderId },
    });
  }

  async updateStatus(id: string, status: PaymentStatus, additionalData?: Partial<Prisma.PaymentUpdateInput>): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status,
        ...additionalData,
      },
    });
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus, orderStatus?: OrderStatus): Promise<void> {
    const dataToUpdate: Prisma.OrderUpdateInput = {
      paymentStatus,
    };
    if (orderStatus) {
      dataToUpdate.status = orderStatus;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
    });
  }
}
