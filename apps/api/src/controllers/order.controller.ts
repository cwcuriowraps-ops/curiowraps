import type { Request, Response } from "express";

import type { OrderService } from "../services/order.service";

export interface OrderControllerDeps {
  orderService: OrderService;
}

export function createOrderController(deps: OrderControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const result = await deps.orderService.getAllOrders({
        page: Number.parseInt(req.query.page as string, 10) || 1,
        limit: Number.parseInt(req.query.limit as string, 10) || 20,
        search: req.query.search as string | undefined,
      });
      res.json({
        success: true,
        data: { orders: result.orders },
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    },

    getById: async (req: Request, res: Response) => {
      const order = await deps.orderService.getOrderById(req.params.id as string);
      res.json({ success: true, data: { order } });
    },

    getMyOrders: async (req: Request, res: Response) => {
      const orders = await deps.orderService.getMyOrders(req.authUser!.id);
      res.json({ success: true, data: { orders } });
    },

    createFromCart: async (req: Request, res: Response) => {
      const order = await deps.orderService.createOrderFromCart(req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.status(201).json({ success: true, data: { order } });
    },

    updateStatus: async (req: Request, res: Response) => {
      const order = await deps.orderService.updateOrderStatus(req.params.id as string, req.body.status, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { order } });
    },

    updatePaymentStatus: async (req: Request, res: Response) => {
      const order = await deps.orderService.updateOrderPaymentStatus(req.params.id as string, req.body.paymentStatus, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { order } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.orderService.deleteOrder(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, message: "Order deleted successfully" });
    },
  };
}
