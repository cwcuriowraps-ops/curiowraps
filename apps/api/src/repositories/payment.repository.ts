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

  async updateStatus(
    id: string,
    status: PaymentStatus,
    additionalData?: Partial<Prisma.PaymentUpdateInput>,
    tx?: any
  ): Promise<Payment> {
    const client = tx ?? this.prisma;
    return client.payment.update({
      where: { id },
      data: {
        status,
        ...additionalData,
      },
    });
  }

  async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    orderStatus?: OrderStatus,
    tx?: any
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const dataToUpdate: Prisma.OrderUpdateInput = {
      paymentStatus,
    };
    if (orderStatus) {
      dataToUpdate.status = orderStatus;
    }

    await client.order.update({
      where: { id: orderId },
      data: dataToUpdate,
    });
  }
}
