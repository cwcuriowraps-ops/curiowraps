import crypto from "crypto";

import { PrismaClient, PaymentStatus, PaymentMethod, OrderStatus, Payment } from "@prisma/client";
import Razorpay from "razorpay";

import { AppError } from "../middleware/error-handler";
import { OrderRepository } from "../repositories/order.repository";
import { PaymentRepository } from "../repositories/payment.repository";

import { AuditService } from "./audit.service";
import { InventoryService } from "./inventory.service";
import { QueueService } from "./queue.service";


export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepo: PaymentRepository,
    private readonly orderRepo: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
    private readonly queueService?: QueueService
  ) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error(
        "[PaymentService] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. " +
        "Razorpay payments will fail at runtime. Please set both variables in apps/api/.env."
      );
    }

    this.razorpay = new Razorpay({
      key_id: keyId || "rzp_test_dummy",
      key_secret: keySecret || "dummy_secret",
    });
  }

  async createRazorpayOrder(orderId: string, userId: string): Promise<Payment> {
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

    // Cancel any pending payments for this order
    const existingPayments = await this.paymentRepo.findByOrderId(orderId);
    for (const payment of existingPayments) {
      if (payment.status === PaymentStatus.PENDING) {
        await this.paymentRepo.updateStatus(payment.id, PaymentStatus.CANCELLED);
      }
    }

    // Amount in paise
    const amountInPaise = Math.round(Number(order.grandTotal) * 100);

    // Create Razorpay Order
    let rzpOrder;
    try {
      rzpOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: order.currency,
        receipt: order.orderNumber,
      });
    } catch (e) {
      console.error("Razorpay Error:", e);
      throw new AppError(500, "INTERNAL_SERVER_ERROR", "Failed to initialize payment with Razorpay");
    }

    // Create Payment Record
    const payment = await this.paymentRepo.create({
      orderId: order.id,
      provider: PaymentMethod.RAZORPAY,
      amount: order.grandTotal,
      currency: order.currency,
      providerOrderId: rzpOrder.id,
      status: PaymentStatus.PENDING,
      rawPayload: rzpOrder as any,
    });

    await this.auditService.logAction({
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      actorUserId: userId,
      metadata: { providerOrderId: rzpOrder.id, method: "RAZORPAY" },
    });

    return payment;
  }

  async verifyRazorpayPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string
  ): Promise<Payment> {
    const payment = await this.paymentRepo.findByProviderOrderId(razorpayOrderId);
    if (!payment) {
      throw new AppError(404, "NOT_FOUND", "Payment record not found");
    }

    const order = await this.orderRepo.findById(payment.orderId);
    if (!order || order.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not authorized");
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment; // Idempotent
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "dummy_secret";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const expected = Buffer.from(generatedSignature);
    const received = Buffer.from(razorpaySignature);
    const isValid = expected.length === received.length && crypto.timingSafeEqual(expected, received);

    if (!isValid) {
      await this.paymentRepo.updateStatus(payment.id, PaymentStatus.FAILED);
      await this.auditService.logAction({
        action: "UPDATE",
        entityType: "Payment",
        entityId: payment.id,
        actorUserId: userId,
        metadata: { status: "FAILED", reason: "Invalid Signature" },
      });
      throw new AppError(400, "BAD_REQUEST", "Invalid payment signature");
    }

    // Payment signature is valid. Perform payment status update, order status update, and inventory commit in a single atomic transaction.
    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      // Atomic status update: returns count=0 if already marked PAID concurrently
      const updateResult = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: PaymentStatus.PAID },
        },
        data: {
          status: PaymentStatus.PAID,
          providerPaymentId: razorpayPaymentId,
          providerSignature: razorpaySignature,
          paidAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        // Idempotent: payment was already updated to PAID concurrently
        return (await tx.payment.findUnique({ where: { id: payment.id } })) || payment;
      }

      await this.paymentRepo.updateOrderPaymentStatus(order.id, PaymentStatus.PAID, OrderStatus.CONFIRMED, tx);

      const locationId = await this.inventoryService.getDefaultLocationId(tx);
      const orderWithItems = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
      if (orderWithItems) {
        for (const item of orderWithItems.items) {
          if (item.variantId) {
            await this.inventoryService.commitInventory(item.variantId, locationId, item.quantity, order.id, tx);
          }
        }
      }

      return (await tx.payment.findUnique({ where: { id: payment.id } })) || payment;
    });

    await this.auditService.logAction({
      action: "UPDATE",
      entityType: "Payment",
      entityId: payment.id,
      actorUserId: userId,
      metadata: { status: "PAID", providerPaymentId: razorpayPaymentId },
    });

    if (this.queueService) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        this.queueService.sendEmail("ORDER_CONFIRMATION", {
          email: user.email,
          firstName: user.firstName,
          orderId: order.orderNumber,
          total: order.grandTotal,
        }).catch(console.error);

        this.queueService.sendEmail("PAYMENT_SUCCESS", {
          email: user.email,
          firstName: user.firstName,
          orderId: order.orderNumber,
        }).catch(console.error);
      }
    }

    return updatedPayment;
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
      });

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
    });

    await this.auditService.logAction({
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      actorUserId: userId,
      metadata: { method: "COD", status: "PENDING" },
    });

    if (this.queueService) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        this.queueService.sendEmail("ORDER_CONFIRMATION", {
          email: user.email,
          firstName: user.firstName,
          orderId: order.orderNumber,
          total: order.grandTotal,
        }).catch(console.error);
      }
    }

    return payment;
  }

  async handleWebhook(event: string, payload: any): Promise<void> {
    // Determine order_id or payment_id from payload
    const entity = payload?.payload?.payment?.entity;
    if (!entity) return;

    const rzpOrderId = entity.order_id;
    const rzpPaymentId = entity.id;

    let payment = null;
    if (rzpOrderId) {
      payment = await this.paymentRepo.findByProviderOrderId(rzpOrderId);
    }

    if (!payment) return; // Unknown payment, skip

    switch (event) {
      case "payment.authorized":
        if (payment.status === PaymentStatus.PENDING) {
          await this.paymentRepo.updateStatus(payment.id, PaymentStatus.AUTHORIZED, {
            providerPaymentId: rzpPaymentId,
          });
          await this.auditService.logAction({
            action: "UPDATE",
            entityType: "Payment",
            entityId: payment.id,
            actorUserId: "SYSTEM",
            metadata: { status: "AUTHORIZED", source: "Webhook" },
          });
        }
        break;

      case "payment.captured":
        await this.prisma.$transaction(async (tx) => {
          // Atomic status update: returns count=0 if already marked PAID concurrently
          const updateResult = await tx.payment.updateMany({
            where: {
              id: payment.id,
              status: { not: PaymentStatus.PAID },
            },
            data: {
              status: PaymentStatus.PAID,
              providerPaymentId: rzpPaymentId,
              paidAt: new Date(),
            },
          });

          if (updateResult.count === 0) {
            return; // Idempotent: already processed by client verification or duplicate webhook
          }

          await this.paymentRepo.updateOrderPaymentStatus(payment.orderId, PaymentStatus.PAID, OrderStatus.CONFIRMED, tx);
          
          const locationId = await this.inventoryService.getDefaultLocationId(tx);
          const orderWithItems = await tx.order.findUnique({ where: { id: payment.orderId }, include: { items: true } });
          if (orderWithItems) {
            for (const item of orderWithItems.items) {
              if (item.variantId) {
                await this.inventoryService.commitInventory(item.variantId, locationId, item.quantity, payment.orderId, tx);
              }
            }
          }
        });

        await this.auditService.logAction({
          action: "UPDATE",
          entityType: "Payment",
          entityId: payment.id,
          actorUserId: "SYSTEM",
          metadata: { status: "PAID", source: "Webhook" },
        });
        break;

      case "payment.failed":
        await this.prisma.$transaction(async (tx) => {
          const freshPayment = await tx.payment.findUnique({ where: { id: payment.id } });
          if (!freshPayment || freshPayment.status === PaymentStatus.FAILED || freshPayment.status === PaymentStatus.PAID) {
            return; // Idempotent
          }

          await this.paymentRepo.updateStatus(
            payment.id,
            PaymentStatus.FAILED,
            {
              providerPaymentId: rzpPaymentId,
            },
            tx
          );
          await this.paymentRepo.updateOrderPaymentStatus(payment.orderId, PaymentStatus.FAILED, OrderStatus.CANCELLED, tx);
          
          const locationId = await this.inventoryService.getDefaultLocationId(tx);
          const orderWithItems = await tx.order.findUnique({ where: { id: payment.orderId }, include: { items: true } });
          if (orderWithItems) {
            for (const item of orderWithItems.items) {
              if (item.variantId) {
                await this.inventoryService.releaseInventory(item.variantId, locationId, item.quantity, payment.orderId, tx);
              }
            }
          }
        });

        await this.auditService.logAction({
          action: "UPDATE",
          entityType: "Payment",
          entityId: payment.id,
          actorUserId: "SYSTEM",
          metadata: { status: "FAILED", source: "Webhook" },
        });
        break;

      case "refund.processed":
        // Architecture for future refund API integration
        // Determine if full or partial refund
        if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.PARTIALLY_REFUNDED) {
          await this.paymentRepo.updateStatus(payment.id, PaymentStatus.REFUNDED, {
            refundedAt: new Date(),
          });
          await this.paymentRepo.updateOrderPaymentStatus(payment.orderId, PaymentStatus.REFUNDED, OrderStatus.REFUNDED);
          await this.auditService.logAction({
            action: "UPDATE",
            entityType: "Payment",
            entityId: payment.id,
            actorUserId: "SYSTEM",
            metadata: { status: "REFUNDED", source: "Webhook" },
          });
        }
        break;
    }
  }
}
