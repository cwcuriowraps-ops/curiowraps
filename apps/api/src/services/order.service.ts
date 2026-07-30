import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@dashboard/database";

import { systemEvents, EVENTS } from "../lib/events";
import { AppError } from "../middleware/error-handler";
import { OrderRepository } from "../repositories/order.repository";

import { AuditService } from "./audit.service";
import { CartService } from "./cart.service";
import { CouponService } from "./coupon.service";
import { InventoryService } from "./inventory.service";

export class OrderService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly orderRepository: OrderRepository,
    private readonly cartService: CartService,
    private readonly couponService: CouponService,
    private readonly inventoryService: InventoryService
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
    // 1. Resolve Cart
    const cart = await this.cartService.getCart(undefined, actorUserId);
    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "BAD_REQUEST", "Cart is empty");
    }

    // 2. Validate Coupon & Re-calculate totals
    let discountAmount = 0;
    let couponId = undefined;
    if (data.couponCode) {
      const validation = await this.couponService.validateCoupon(data.couponCode, cart.totals.subtotal, actorUserId);
      discountAmount = validation.discountAmount;
      couponId = validation.coupon.id;
    }

    const subtotal = cart.totals.subtotal;
    const tax = cart.totals.tax;
    const shipping = cart.totals.shipping;
    const grandTotal = subtotal + tax + shipping - discountAmount;

    // 3. Create Immutable Order Snapshot
    const orderItems = cart.items.map((item: any) => ({
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
    };

    const locationId = await this.inventoryService.getDefaultLocationId();

    // 4. Create Order and Reserve Inventory inside a Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({ data: orderData as any, include: { items: true } });

      for (const item of cart.items) {
        // Reserve inventory. Throws if out of stock, rolling back the transaction.
        await this.inventoryService.reserveInventory(item.variant.id, locationId, item.quantity, tx);
      }

      return newOrder;
    });

    // 5. Clear Cart (Non-transactional, safe to run after success)
    await this.cartService.clearCart(undefined, actorUserId);

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

    return order;
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string, actorUserId: string, context: any) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new AppError(404, "NOT_FOUND", "Order not found");

    const updated = await this.prisma.order.update({
      where: { id },
      data: { paymentStatus: paymentStatus as any },
      include: { items: true },
    });

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Order",
      entityId: id,
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: updated.paymentStatus },
      ...context,
    });

    systemEvents.emit(EVENTS.ORDER_UPDATED, updated);
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

    return result;
  }
}
