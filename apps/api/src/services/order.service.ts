import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@dashboard/database";

import { invalidateDashboardStatsCache } from "../controllers/admin-system.controller";
import { systemEvents, EVENTS } from "../lib/events";
import { AppError } from "../middleware/error-handler";
import { OrderRepository } from "../repositories/order.repository";

import { AuditService } from "./audit.service";
import { CartService } from "./cart.service";
import { CouponService } from "./coupon.service";
import { InventoryService } from "./inventory.service";
import type { QueueService } from "./queue.service";

export class OrderService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly orderRepository: OrderRepository,
    private readonly cartService: CartService,
    private readonly couponService: CouponService,
    private readonly inventoryService: InventoryService,
    private readonly queueService?: QueueService
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllOrders(options?: { page?: number; limit?: number; search?: string }) {
    return this.orderRepository.findAll(options);
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");
    return order;
  }

  async getMyOrders(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async createOrderFromCart(data: any, actorUserId: string, context: any) {
    let cartTotals;
    let cartItems;
    const isBuyNow = !!data.buyNowItem;

    if (isBuyNow) {
      // 1a. Resolve Buy Now Item
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: data.buyNowItem.variantId },
        include: { product: true }
      });
      if (!variant || variant.deletedAt || !variant.isActive) {
        throw new AppError(400, "BAD_REQUEST", "Variant is not available");
      }
      const mockCart = {
        items: [{
          variant,
          quantity: data.buyNowItem.quantity,
          customization: data.buyNowItem.customization
        }]
      };
      const calculated = await this.cartService.calculateTotals(mockCart);
      cartTotals = calculated!.totals;
      cartItems = calculated!.items;
    } else {
      // 1b. Resolve Cart
      const cart = await this.cartService.getCart(undefined, actorUserId);
      if (!cart || cart.items.length === 0) {
        throw new AppError(400, "BAD_REQUEST", "Cart is empty");
      }
      cartTotals = cart.totals;
      cartItems = cart.items;
    }

    // 2. Validate Coupon & Re-calculate totals
    let discountAmount = 0;
    let couponId = undefined;
    if (data.couponCode) {
      const validation = await this.couponService.validateCoupon(data.couponCode, cartTotals.subtotal, actorUserId);
      discountAmount = validation.discountAmount;
      couponId = validation.coupon.id;
    }

    const subtotal = cartTotals.subtotal;
    const tax = cartTotals.tax;
    const shipping = cartTotals.shipping;
    const grandTotal = subtotal + tax + shipping - discountAmount;

    // 3. Create Immutable Order Snapshot
    const orderItems = cartItems.map((item: any) => ({
      variantId: item.variant.id,
      productId: item.variant.product.id,
      sku: item.variant.sku,
      productName: item.variant.product.name,
      variantName: item.variant.title,
      unitPrice: item.variant.price,
      quantity: item.quantity,
      totalPrice: parseFloat(item.variant.price.toString()) * item.quantity,
      customization: item.customization || null,
      productSnapshot: {
        name: item.variant.product.name,
        slug: item.variant.product.slug,
      },
      variantSnapshot: {
        sku: item.variant.sku,
        title: item.variant.title,
        optionValues: item.variant.optionValues,
      },
    }));

    const upiTxId = data.paymentMethod === "UPI" && data.upiTransactionId ? String(data.upiTransactionId).trim() : undefined;

    const orderData = {
      user: { connect: { id: actorUserId } },
      orderNumber: `CW-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: data.paymentMethod,
      subtotal,
      taxTotal: tax,
      shippingTotal: shipping,
      discountTotal: discountAmount,
      grandTotal,
      currency: "INR",
      shippingAddressSnapshot: data.shippingAddress,
      billingAddressSnapshot: data.billingAddress || data.shippingAddress,
      notes: data.notes,
      couponId,
      items: {
        create: orderItems,
      },
      payments: {
        create: [{
          provider: data.paymentMethod,
          amount: grandTotal,
          currency: "INR",
          status: "PENDING",
          ...(upiTxId ? { providerPaymentId: upiTxId, rawPayload: { upiTransactionId: upiTxId } } : {}),
        }],
      },
    };

    const locationId = await this.inventoryService.getDefaultLocationId();

    // 4. Create Order and Reserve Inventory inside a Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({ data: orderData as any, include: { items: true } });

      for (const item of cartItems) {
        // Reserve inventory. Throws if out of stock, rolling back the transaction.
        await this.inventoryService.reserveInventory(item.variant.id, locationId, item.quantity, tx);
      }

      return newOrder;
    }, { maxWait: 10000, timeout: 20000 });

    // 5. Clear Cart (Non-transactional, safe to run after success) - ONLY if not a Buy Now order
    if (!isBuyNow) {
      await this.cartService.clearCartDirect(undefined, actorUserId);
    }

    // 6. Record Redemption if coupon used
    if (couponId) {
      await this.prisma.$transaction([
        this.prisma.couponRedemption.create({
          data: {
            couponId,
            userId: actorUserId,
            orderId: order.id,
            discountAmount,
          } as any,
        }),
        this.prisma.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        }),
      ]);
    }

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "Order",
      entityId: order.id,
      after: order as any,
      ...context,
    });

    systemEvents.emit(EVENTS.ORDER_CREATED, order);
    invalidateDashboardStatsCache();

    return order;
  }

  async updateOrderPaymentStatus(id: string, newPaymentStatus: string, actorUserId: string, context: any) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");

    const previousPaymentStatus = order.paymentStatus;

    // Idempotent duplicate check: If status is already the requested status, return early
    if (previousPaymentStatus === newPaymentStatus) {
      return order;
    }

    const locationId = await this.inventoryService.getDefaultLocationId();

    const updated = await this.prisma.$transaction(async (tx) => {
      let targetOrderStatus = order.status;

      // Handle transition to PAID
      if (newPaymentStatus === "PAID") {
        if (order.status === "PENDING") {
          targetOrderStatus = "CONFIRMED";
        }

        // Commit inventory if coming from PENDING
        if (previousPaymentStatus === "PENDING") {
          for (const item of order.items) {
            if (item.variantId) {
              await this.inventoryService.commitInventory(item.variantId, locationId, item.quantity, order.id, tx);
            }
          }
        }
      } else if (newPaymentStatus === "FAILED" || newPaymentStatus === "CANCELLED") {
        targetOrderStatus = "CANCELLED";

        // Release reserved inventory if cancelling a pending order
        if (previousPaymentStatus === "PENDING") {
          for (const item of order.items) {
            if (item.variantId) {
              await this.inventoryService.releaseInventory(item.variantId, locationId, item.quantity, order.id, tx);
            }
          }
        }
      }

      // Update Order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          paymentStatus: newPaymentStatus as any,
          status: targetOrderStatus as any,
        },
        include: { items: true },
      });

      // Update associated Payment records
      await tx.payment.updateMany({
        where: { orderId: id },
        data: {
          status: newPaymentStatus as any,
          ...(newPaymentStatus === "PAID" ? { paidAt: new Date() } : {}),
        },
      });

      return updatedOrder;
    });

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Order",
      entityId: id,
      before: { paymentStatus: previousPaymentStatus, status: order.status },
      after: { paymentStatus: updated.paymentStatus, status: updated.status },
      ...context,
    });

    // Send confirmation email when marked PAID for the first time
    if (newPaymentStatus === "PAID" && previousPaymentStatus !== "PAID" && this.queueService) {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
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

    systemEvents.emit(EVENTS.ORDER_UPDATED, updated);
    invalidateDashboardStatsCache();
    return updated;
  }

  async updateOrderStatus(id: string, status: string, actorUserId: string, context: any) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");

    const updatedOrder = await this.orderRepository.updateStatus(id, status);

    // If cancelled, restore inventory
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      const locationId = await this.inventoryService.getDefaultLocationId();
      for (const item of order.items) {
        await this.inventoryService.adjustInventory(
          {
            variantId: item.variantId,
            locationId,
            quantityChange: item.quantity,
            type: "RESTOCK",
            referenceType: "ORDER_CANCEL",
            referenceId: order.id,
          },
          actorUserId,
          context
        );
      }
    }

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Order",
      entityId: id,
      before: { status: order.status },
      after: { status: updatedOrder.status },
      ...context,
    });

    systemEvents.emit(EVENTS.ORDER_UPDATED, updatedOrder);
    invalidateDashboardStatsCache();

    return updatedOrder;
  }

  async deleteOrder(id: string, actorUserId?: string, context?: any) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError(404, "NOT_FOUND", "Order not found");
    }

    const result = await this.orderRepository.deleteOrder(id);

    if (actorUserId) {
      await this.auditService.logAction({
        actorUserId,
        action: "DELETE",
        entityType: "Order",
        entityId: id,
        before: { orderNumber: order.orderNumber, status: order.status, grandTotal: order.grandTotal },
        ...context,
      });
    }

    invalidateDashboardStatsCache();

    return result;
  }
}
