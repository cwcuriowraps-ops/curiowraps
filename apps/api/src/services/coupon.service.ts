import type { PrismaClient } from "@dashboard/database";

import { AppError } from "../middleware/error-handler";
import { CouponRepository } from "../repositories/coupon.repository";

import { AuditService } from "./audit.service";

export class CouponService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly couponRepository: CouponRepository
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllCoupons(includeInactive = false) {
    return this.couponRepository.findAll(includeInactive);
  }

  async getCouponById(id: string) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) throw new AppError(404, "NOT_FOUND", "Coupon not found");
    return coupon;
  }

  async createCoupon(data: any, actorUserId: string, context: any) {
    const existing = await this.couponRepository.findByCode(data.code);
    if (existing) throw new AppError(400, "BAD_REQUEST", "Coupon code already exists");

    const coupon = await this.couponRepository.create(data);

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "Coupon",
      entityId: coupon.id,
      after: coupon as any,
      ...context,
    });

    return coupon;
  }

  async updateCoupon(id: string, data: any, actorUserId: string, context: any) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) throw new AppError(404, "NOT_FOUND", "Coupon not found");

    if (data.code && data.code !== coupon.code) {
      const existing = await this.couponRepository.findByCode(data.code);
      if (existing) throw new AppError(400, "BAD_REQUEST", "Coupon code already exists");
    }

    const updatedCoupon = await this.couponRepository.update(id, data);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "Coupon",
      entityId: id,
      before: coupon as any,
      after: updatedCoupon as any,
      ...context,
    });

    return updatedCoupon;
  }

  async deleteCoupon(id: string, actorUserId: string, context: any) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) throw new AppError(404, "NOT_FOUND", "Coupon not found");

    await this.couponRepository.delete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "Coupon",
      entityId: id,
      before: coupon as any,
      ...context,
    });
  }

  async validateCoupon(code: string, cartTotal: number, userId?: string) {
    const coupon = await this.couponRepository.findByCode(code);
    
    if (!coupon || !coupon.isActive) {
      throw new AppError(400, "BAD_REQUEST", "Invalid or inactive coupon");
    }

    const now = new Date();
    if ((coupon as any).startDate && now < new Date((coupon as any).startDate)) {
      throw new AppError(400, "BAD_REQUEST", "Coupon is not yet active");
    }

    if ((coupon as any).endDate && now > new Date((coupon as any).endDate)) {
      throw new AppError(400, "BAD_REQUEST", "Coupon has expired");
    }

    if (coupon.usageLimit && coupon.redemptions.length >= coupon.usageLimit) {
      throw new AppError(400, "BAD_REQUEST", "Coupon usage limit reached");
    }

    if (userId && coupon.perUserLimit) {
      const userRedemptions = coupon.redemptions.filter(r => r.userId === userId).length;
      if (userRedemptions >= coupon.perUserLimit) {
        throw new AppError(400, "BAD_REQUEST", "You have reached the usage limit for this coupon");
      }
    }

    const minAmount = coupon.minOrderAmount ? parseFloat(coupon.minOrderAmount.toString()) : 0;
    if (minAmount > 0 && cartTotal < minAmount) {
      throw new AppError(400, "BAD_REQUEST", `Minimum order amount of ${minAmount} required`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    const value = parseFloat(coupon.value.toString());
    
    if (coupon.type === "FIXED") {
      discountAmount = value;
    } else if (coupon.type === "PERCENTAGE") {
      discountAmount = cartTotal * (value / 100);
      const maxDiscount = (coupon as any).maxDiscount ? parseFloat((coupon as any).maxDiscount.toString()) : 0;
      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else if (coupon.type === "FREE_SHIPPING") {
      // Handled by shipping module logic
      discountAmount = 0; 
    }

    return {
      coupon,
      discountAmount,
    };
  }
}
