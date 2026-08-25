import { Request, Response, NextFunction, Router } from "express";

import type { ApiDependencies } from "../context";
import { createRequireAuth } from "../middleware/auth";

export function createPublicReviewRouter(deps: ApiDependencies) {
  const router = Router();
  const requireAuth = createRequireAuth({ authService: deps.authService, config: deps.config });

  // Get approved reviews & rating statistics for a product
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, page = "1", limit = "10" } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { isApproved: true, deletedAt: null };
      if (productId) {
        where.productId = String(productId);
      }

      const reviews = await deps.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      });

      let total = reviews.length;
      let averageRating = 0;
      let reviewCount = 0;
      const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      if (skip === 0 && reviews.length < Number(limit)) {
        // Fast-path: all reviews fit on page 1, compute stats in memory without extra DB queries
        reviewCount = reviews.length;
        if (reviewCount > 0) {
          let sum = 0;
          reviews.forEach((r: any) => {
            sum += r.rating;
            if (r.rating >= 1 && r.rating <= 5) {
              distribution[r.rating] = (distribution[r.rating] || 0) + 1;
            }
          });
          averageRating = Math.round((sum / reviewCount) * 10) / 10;
        }
      } else {
        const [totalCount, aggregateStats, rawRatingCounts] = await Promise.all([
          deps.prisma.review.count({ where }),
          deps.prisma.review.aggregate({
            where,
            _avg: { rating: true },
            _count: { rating: true },
          }),
          deps.prisma.review.groupBy({
            by: ["rating"],
            where,
            _count: { rating: true },
          }),
        ]);

        total = totalCount;
        rawRatingCounts.forEach((item: any) => {
          if (item.rating >= 1 && item.rating <= 5) {
            distribution[item.rating] = item._count.rating;
          }
        });
        const avgRatingRaw = aggregateStats._avg.rating || 0;
        averageRating = Math.round(avgRatingRaw * 10) / 10;
        reviewCount = aggregateStats._count.rating || 0;
      }

      res.json({
        success: true,
        data: {
          reviews,
          stats: {
            averageRating,
            reviewCount,
            distribution,
          },
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)) || 1,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Check if logged-in user is eligible to review a product
  router.get("/eligibility", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || req.authUser?.id;
      const { productId } = req.query;

      if (!productId || typeof productId !== "string") {
        res.status(400).json({ success: false, error: "productId parameter is required" });
        return;
      }

      // Parallelize checking delivered purchase and existing review
      const [deliveredOrder, existingReview] = await Promise.all([
        deps.prisma.order.findFirst({
          where: {
            userId,
            status: "DELIVERED",
            items: {
              some: {
                productId: String(productId),
              },
            },
          },
          select: { id: true, status: true, createdAt: true },
        }),
        deps.prisma.review.findFirst({
          where: {
            userId,
            productId: String(productId),
            deletedAt: null,
          },
        }),
      ]);

      const hasPurchased = Boolean(deliveredOrder);
      const canReview = hasPurchased;

      res.json({
        success: true,
        data: {
          canReview,
          hasPurchased,
          isDelivered: Boolean(deliveredOrder),
          existingReview,
          reason: canReview
            ? "Eligible to write/edit review for this delivered purchase."
            : "Only customers with a delivered purchase can leave a review.",
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Get current user's submitted reviews
  router.get("/my-reviews", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || req.authUser?.id;
      const reviews = await deps.prisma.review.findMany({
        where: { userId, deletedAt: null },
        include: {
          product: { select: { id: true, name: true, slug: true, images: { take: 1 } } },
        },
        orderBy: { updatedAt: "desc" },
      });

      res.json({
        success: true,
        data: { reviews },
      });
    } catch (err) {
      next(err);
    }
  });

  // Create or Update a review (Strictly for delivered orders)
  router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || req.authUser?.id;
      const { productId, rating, title, body, comment, images = [] } = req.body;

      if (!productId) {
        res.status(400).json({ success: false, error: "productId is required" });
        return;
      }

      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        res.status(400).json({ success: false, error: "Rating must be an integer between 1 and 5" });
        return;
      }

      // Verify that user has purchased and received the product (status DELIVERED)
      const deliveredOrder = await deps.prisma.order.findFirst({
        where: {
          userId,
          status: "DELIVERED",
          items: {
            some: {
              productId: String(productId),
            },
          },
        },
      });

      if (!deliveredOrder) {
        res.status(403).json({
          success: false,
          error: "You can only review products from delivered orders that you have purchased.",
        });
        return;
      }

      const reviewContent = body || comment || "";
      const reviewImages = Array.isArray(images) ? images.filter((img: any) => typeof img === "string") : [];

      // Check if user already reviewed this product
      const existingReview = await deps.prisma.review.findFirst({
        where: { userId, productId: String(productId), deletedAt: null },
      });

      let review;
      if (existingReview) {
        review = await deps.prisma.review.update({
          where: { id: existingReview.id },
          data: {
            rating: numericRating,
            title: title ? String(title) : null,
            body: reviewContent,
            images: reviewImages,
            isApproved: false, // Reset to false for re-moderation when updated
          },
        });
      } else {
        review = await deps.prisma.review.create({
          data: {
            userId,
            productId: String(productId),
            rating: numericRating,
            title: title ? String(title) : null,
            body: reviewContent,
            images: reviewImages,
            isApproved: false, // New reviews require admin approval
          },
        });
      }

      res.json({
        success: true,
        data: {
          review,
          message: existingReview
            ? "Your review has been updated and submitted for approval."
            : "Thank you! Your review has been submitted and will appear once approved by an admin.",
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
