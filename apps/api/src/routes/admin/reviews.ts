import { Request, Response, NextFunction, Router } from "express";

import type { ApiDependencies } from "../../context";
import { createRequireAuth } from "../../middleware/auth";

export function createAdminReviewRouter(deps: ApiDependencies) {
  const router = Router();
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  router.use(requireAuth);

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = "1", limit = "10", search = "", productId, rating, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { deletedAt: null };

      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: "insensitive" } },
          { body: { contains: String(search), mode: "insensitive" } },
          { product: { name: { contains: String(search), mode: "insensitive" } } },
          { user: { firstName: { contains: String(search), mode: "insensitive" } } },
          { user: { lastName: { contains: String(search), mode: "insensitive" } } },
          { user: { email: { contains: String(search), mode: "insensitive" } } },
        ];
      }

      if (productId && productId !== "all") {
        where.productId = String(productId);
      }

      if (rating && rating !== "all") {
        const numRating = Number(rating);
        if (!isNaN(numRating)) {
          where.rating = numRating;
        }
      }

      if (status && status !== "all") {
        if (status === "approved") {
          where.isApproved = true;
        } else if (status === "pending" || status === "rejected") {
          where.isApproved = false;
        }
      }

      const [reviews, total, products] = await Promise.all([
        deps.prisma.review.findMany({
          where,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
            product: { select: { id: true, name: true, slug: true, images: { take: 1 } } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        deps.prisma.review.count({ where }),
        deps.prisma.product.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
      ]);

      res.json({
        success: true,
        data: {
          reviews,
          products,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      const review = await deps.prisma.review.update({
        where: { id },
        data: { isApproved: Boolean(isApproved) },
      });

      res.json({
        success: true,
        data: { review },
      });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await deps.prisma.review.delete({ where: { id } });

      res.json({
        success: true,
        data: { message: "Review deleted successfully" },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
