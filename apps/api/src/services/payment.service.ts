import { PrismaClient, PaymentStatus, PaymentMethod, OrderStatus, Payment } from "@prisma/client";

import { AppError } from "../middleware/error-handler";
import { OrderRepository } from "../repositories/order.repository";
import { PaymentRepository } from "../repositories/payment.repository";

import { AuditService } from "./audit.service";
import { InventoryService } from "./inventory.service";
import { QueueService } from "./queue.service";

export class PaymentService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepo: PaymentRepository,
    private readonly orderRepo: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly queueService?: QueueService
  ) {}

  async createUpiPayment(orderId: string, userId: string, upiTransactionId?: string): Promise<Payment> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not authorized to access this order");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new AppError(400, "BAD_REQUEST", "Order is already paid");
    }

    const txId = upiTransactionId?.trim();

    // Check existing pending payments for this order
    const existingPayments = await this.paymentRepo.findByOrderId(orderId);
    const existingUpi = existingPayments.find((p) => p.provider === PaymentMethod.UPI && p.status === PaymentStatus.PENDING);

    if (existingUpi) {
      if (txId && !existingUpi.providerPaymentId) {
        return this.prisma.payment.update({
          where: { id: existingUpi.id },
          data: {
            providerPaymentId: txId,
            rawPayload: { upiTransactionId: txId },
          },
        });
      }
      return existingUpi;
    }

    for (const payment of existingPayments) {
      if (payment.status === PaymentStatus.PENDING) {
        await this.paymentRepo.updateStatus(payment.id, PaymentStatus.CANCELLED);
      }
    }

    // Create Payment Record for manual UPI
    const payment = await this.paymentRepo.create({
      orderId: order.id,
      provider: PaymentMethod.UPI,
      amount: order.grandTotal,
      currency: order.currency,
      status: PaymentStatus.PENDING,
      providerPaymentId: txId,
      rawPayload: txId ? { upiTransactionId: txId } : undefined,
    });

    this.auditService.logAction({
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      actorUserId: userId,
      metadata: { method: "UPI", status: "PENDING" },
    }).catch((err) => console.error("Async UPI payment audit log failed:", err));

    return payment;
  }

  async createCodPayment(orderId: string, userId: string): Promise<Payment> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order not found");
    }

    if (order.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not authorized to access this order");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new AppError(400, "BAD_REQUEST", "Order is already paid");
    }

    const existingPayments = await this.paymentRepo.findByOrderId(orderId);
    const existingCod = existingPayments.find((p) => p.provider === PaymentMethod.COD);

    // Idempotent: If COD payment record already exists, return it immediately
    if (existingCod) {
      if (order.status === OrderStatus.PENDING) {
        await this.paymentRepo.updateOrderPaymentStatus(order.id, PaymentStatus.PENDING, OrderStatus.CONFIRMED);
      }
      return existingCod;
    }

    // Idempotent: If order was already confirmed (e.g. directly in createOrderFromCart)
    if (order.status === OrderStatus.CONFIRMED) {
      const p = await this.paymentRepo.create({
        orderId: order.id,
        provider: PaymentMethod.COD,
        amount: order.grandTotal,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      });
      return p;
    }

    for (const payment of existingPayments) {
      if (payment.status === PaymentStatus.PENDING) {
        await this.paymentRepo.updateStatus(payment.id, PaymentStatus.CANCELLED);
      }
    }

    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await this.paymentRepo.create({
        orderId: order.id,
        provider: PaymentMethod.COD,
        amount: order.grandTotal,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      }, tx);

      await this.paymentRepo.updateOrderPaymentStatus(order.id, PaymentStatus.PENDING, OrderStatus.CONFIRMED, tx);

      const locationId = await this.inventoryService.getDefaultLocationId(tx);
      const orderWithItems = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
      if (orderWithItems) {
        for (const item of orderWithItems.items) {
          if (item.variantId) {
            await this.inventoryService.commitInventory(item.variantId, locationId, item.quantity, order.id, tx);
          }
        }
      }

      return p;
    }, { timeout: 20000, maxWait: 10000 });

    this.auditService.logAction({
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      actorUserId: userId,
      metadata: { method: "COD", status: "PENDING" },
    }).catch((err) => console.error("Async COD payment audit log failed:", err));

    if (this.queueService) {
      this.prisma.user.findUnique({ where: { id: userId } }).then((user) => {
        if (user) {
          this.queueService?.sendEmail("ORDER_CONFIRMATION", {
            email: user.email,
            firstName: user.firstName,
            orderId: order.orderNumber,
            total: order.grandTotal,
          }).catch(console.error);
        }
      }).catch(console.error);
    }

    return payment;
  }
}
