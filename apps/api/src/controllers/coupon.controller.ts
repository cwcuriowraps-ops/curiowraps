import type { Request, Response } from "express";

import type { CouponService } from "../services/coupon.service";

export interface CouponControllerDeps {
  couponService: CouponService;
}

export function createCouponController(deps: CouponControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const includeInactive = req.query.includeInactive === "true";
      const coupons = await deps.couponService.getAllCoupons(includeInactive);
      res.json({ success: true, data: { coupons } });
    },

    getById: async (req: Request, res: Response) => {
      const coupon = await deps.couponService.getCouponById(req.params.id as string);
      res.json({ success: true, data: { coupon } });
    },

    create: async (req: Request, res: Response) => {
      const coupon = await deps.couponService.createCoupon(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { coupon } });
    },

    update: async (req: Request, res: Response) => {
      const coupon = await deps.couponService.updateCoupon(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { coupon } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.couponService.deleteCoupon(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Coupon deleted successfully" } });
    },

    validate: async (req: Request, res: Response) => {
      const { code, cartTotal } = req.body;
      const userId = req.authUser?.id;
      
      const validation = await deps.couponService.validateCoupon(code, cartTotal, userId);
      res.json({
        success: true,
        data: {
          isValid: true,
          coupon: validation.coupon,
          discountAmount: validation.discountAmount,
        },
      });
    }
  };
}
