/* eslint-disable import/order */
import { appConfig } from "@dashboard/config";
import { prisma as defaultPrisma } from "@dashboard/database";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import path from "path";

import type { ApiConfig } from "./config";
import { createApiConfig } from "./config";
import type { ApiDependencies } from "./context";
import { openApiSpec } from "./docs/openapi";
import { createLogger } from "./lib/logger";
import { createErrorHandler, notFoundHandler } from "./middleware/error-handler";
import { createRateLimiter } from "./middleware/rate-limiter";
import { createRequestLogger } from "./middleware/request-logger";
import { AttributeRepository } from "./repositories/attribute.repository";
import { BrandRepository } from "./repositories/brand.repository";
import { CategoryRepository } from "./repositories/category.repository";
import { InventoryRepository } from "./repositories/inventory.repository";
import { ProductRepository } from "./repositories/product.repository";
import { SearchRepository } from "./repositories/search.repository";
import { VariantRepository } from "./repositories/variant.repository";
import { SettingRepository } from "./repositories/setting.repository";
import { ContactRepository } from "./repositories/contact.repository";
import { createAdminContactRouter } from "./routes/admin/contact-messages";
import { createPublicContactRouter } from "./routes/public/contact";
import { createAdminAttributeRouter } from "./routes/admin/attributes";
import { createAdminBrandRouter } from "./routes/admin/brands";
import { createAdminCategoryRouter } from "./routes/admin/categories";
import { createAdminUserRouter } from "./routes/admin/users";
import { createAuthRouter } from "./routes/auth";
import { createSystemRouter } from "./routes/health";
import { createUserRouter } from "./routes/users";
import { AdminUserService } from "./services/admin-user.service";
import { AuthService } from "./services/auth.service";
import { UserService } from "./services/user.service";

// Repositories

// Services
import { CategoryService } from "./services/category.service";
import { BrandService } from "./services/brand.service";
import { ProductService } from "./services/product.service";
import { VariantService } from "./services/variant.service";
import { AttributeService } from "./services/attribute.service";
import { InventoryService } from "./services/inventory.service";

// Admin Routes
import { createAdminProductRouter } from "./routes/admin/products";
import { createAdminVariantRouter } from "./routes/admin/variants";
import { createAdminInventoryRouter } from "./routes/admin/inventory";
import { createAdminMediaRouter } from "./routes/admin/media";
import { createAdminCouponRouter } from "./routes/admin/coupons";
import { createAdminOrderRouter } from "./routes/admin/orders";
import { createAdminShippingRouter } from "./routes/admin/shipping";
import { createAdminSettingRouter } from "./routes/admin/settings";
import { createAdminSystemRouter } from "./routes/admin/system";
import { createAdminReviewRouter } from "./routes/admin/reviews";

// Public Routes
import { createPublicCategoryRouter } from "./routes/categories";
import { createPublicBrandRouter } from "./routes/brands";
import { createPublicProductRouter } from "./routes/products";
import { createPublicVariantRouter } from "./routes/variants";
import { createPublicSearchRouter } from "./routes/search";
import { createPublicCartRouter } from "./routes/cart";
import { createPublicWishlistRouter } from "./routes/wishlist";
import { createPublicCouponRouter } from "./routes/coupons";
import { createPublicOrderRouter } from "./routes/orders";
import { createPublicShippingRouter } from "./routes/shipping";
import { createPublicPaymentRouter } from "./routes/payments";
import { createPublicReviewRouter } from "./routes/reviews";
import { createPublicSettingRouter } from "./routes/settings";
import { createWebhookRouter } from "./routes/webhooks";
import { MediaRepository } from "./repositories/media.repository";
import { CartRepository } from "./repositories/cart.repository";
import { WishlistRepository } from "./repositories/wishlist.repository";
import { CouponRepository } from "./repositories/coupon.repository";
import { OrderRepository } from "./repositories/order.repository";
import { ShippingRepository } from "./repositories/shipping.repository";
import { PaymentRepository } from "./repositories/payment.repository";
import { MediaService } from "./services/media.service";
import { CartService } from "./services/cart.service";
import { WishlistService } from "./services/wishlist.service";
import { CouponService } from "./services/coupon.service";
import { OrderService } from "./services/order.service";
import { ShippingService } from "./services/shipping.service";
import { AuditService } from "./services/audit.service";
import { PaymentService } from "./services/payment.service";
import { RedisService } from "./services/redis.service";
import { QueueService } from "./services/queue.service";
import { NotificationService, ConsoleEmailProvider, BrevoEmailProvider } from "./services/notification.service";

function createDependencies(overrides: Partial<ApiDependencies> = {}): ApiDependencies {
  const config: ApiConfig = overrides.config ?? createApiConfig();
  const prisma = overrides.prisma ?? defaultPrisma;

  const categoryRepo = new CategoryRepository(prisma);
  const brandRepo = new BrandRepository(prisma);
  const productRepo = new ProductRepository(prisma);
  const variantRepo = new VariantRepository(prisma);
  const attributeRepo = new AttributeRepository(prisma);
  const inventoryRepo = new InventoryRepository(prisma);
  const searchRepository = new SearchRepository(prisma);
  
  const mediaRepo = new MediaRepository(prisma);
  const cartRepo = new CartRepository(prisma);
  const wishlistRepo = new WishlistRepository(prisma);
  const couponRepo = new CouponRepository(prisma);
  const orderRepo = new OrderRepository(prisma);
  const shippingRepo = new ShippingRepository(prisma);
  const paymentRepo = new PaymentRepository(prisma);
  const auditService = new AuditService(prisma);
  const redisService = overrides.redisService ?? new RedisService();
  
  const emailProvider = process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS
    ? new BrevoEmailProvider()
    : new ConsoleEmailProvider();
    
  const notificationService = overrides.notificationService ?? new NotificationService(emailProvider);
  const queueService = overrides.queueService ?? new QueueService(redisService, notificationService);
  const settingRepository = overrides.settingRepository ?? new SettingRepository(prisma);

  settingRepository
    .findByKey("email_settings")
    .then((setting) => {
      if (setting && setting.value && typeof setting.value === "object") {
        const val = setting.value as any;
        if (val.senderName || val.senderEmail) {
          notificationService.updateEmailSettings(val.senderName, val.senderEmail, val.replyToEmail);
        }
      }
    })
    .catch(() => {});

    const inventoryService = overrides.inventoryService ?? new InventoryService(prisma, inventoryRepo, variantRepo);
    const cartService = overrides.cartService ?? new CartService(prisma, cartRepo, variantRepo, settingRepository);
    const couponService = overrides.couponService ?? new CouponService(prisma, couponRepo);
    const orderService = overrides.orderService ?? new OrderService(prisma, orderRepo, cartService, couponService, inventoryService, queueService);
    const paymentService = overrides.paymentService ?? new PaymentService(prisma, paymentRepo, orderRepo, inventoryService, auditService, queueService);

    return {
      config,
      logger: overrides.logger ?? createLogger(config),
      prisma,
      authService:
        overrides.authService ??
        new AuthService({
          config,
          logger: overrides.logger ?? createLogger(config),
          prisma,
          queueService: queueService,
        }),
      userService: overrides.userService ?? new UserService(prisma, config.bcryptRounds),
      adminUserService: overrides.adminUserService ?? new AdminUserService(prisma),
      
      categoryService: overrides.categoryService ?? new CategoryService(prisma, categoryRepo, redisService),
      brandService: overrides.brandService ?? new BrandService(prisma, brandRepo),
      productService: overrides.productService ?? new ProductService(prisma, productRepo, brandRepo, redisService),
      variantService: overrides.variantService ?? new VariantService(prisma, variantRepo, productRepo),
      attributeService: overrides.attributeService ?? new AttributeService(prisma, attributeRepo),
      inventoryService,
      searchRepository: overrides.searchRepository ?? searchRepository,
      
      mediaService: overrides.mediaService ?? new MediaService(prisma, mediaRepo),
      cartService,
      wishlistService: overrides.wishlistService ?? new WishlistService(wishlistRepo, productRepo, cartService),
      couponService,
      orderService,
      shippingService: overrides.shippingService ?? new ShippingService(prisma, shippingRepo),
      paymentService,
      redisService,
      queueService,
      notificationService,
      settingRepository,
      contactRepository: overrides.contactRepository ?? new ContactRepository(prisma),
    };
}

const KNOWN_PRODUCTION_ORIGINS = [
  "https://curiowraps-storefront.vercel.app",
  "https://curiowraps-admin.vercel.app",
];

const VERCEL_PREVIEW_REGEX = /^https:\/\/curiowraps-(storefront|admin)(-[a-z0-9-]+)?\.vercel\.app$/i;

export function createApp(overrides: Partial<ApiDependencies> = {}): Express {
  const deps = createDependencies(overrides);
  const app = express();

  app.disable("x-powered-by");

  // Configure strict, secure CORS origin checking and preflight handling
  const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
      // Server-to-server or non-browser requests (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, "");

      // 1. Exact match against configured CORS origins (STOREFRONT_URL, ADMIN_URL, or CORS_ORIGINS)
      const isConfigured = deps.config.corsOrigins.some(
        (allowed) => allowed.trim().replace(/\/+$/, "").toLowerCase() === normalizedOrigin.toLowerCase(),
      );
      if (isConfigured) {
        return callback(null, true);
      }

      // 2. Exact match against storefrontUrl or adminUrl
      if (
        (deps.config.storefrontUrl && deps.config.storefrontUrl.trim().replace(/\/+$/, "").toLowerCase() === normalizedOrigin.toLowerCase()) ||
        (deps.config.adminUrl && deps.config.adminUrl.trim().replace(/\/+$/, "").toLowerCase() === normalizedOrigin.toLowerCase())
      ) {
        return callback(null, true);
      }

      // 3. Match known production Storefront and Admin Vercel origins
      const isKnownProduction = KNOWN_PRODUCTION_ORIGINS.some(
        (allowed) => allowed.toLowerCase() === normalizedOrigin.toLowerCase(),
      );
      if (isKnownProduction || VERCEL_PREVIEW_REGEX.test(normalizedOrigin)) {
        return callback(null, true);
      }

      // 4. In development & test environments, permit local development hosts
      if (deps.config.nodeEnv !== "production") {
        try {
          const parsed = new URL(normalizedOrigin);
          if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
            return callback(null, true);
          }
        } catch {
          // Ignore URL parse failures
        }
      }

      // Reject disallowed origin cleanly without throwing 500 internal server error
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  };

  // Mount CORS first so preflight OPTIONS and cross-origin headers apply to all routes & error responses
  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.use(cookieParser());

  // Static uploads (bypasses rate limiting and body parsing)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "31536000s",
    immutable: true,
  }));

  // System & Health routes (bypasses rate limiting)
  app.use("/", createSystemRouter(deps));
  app.use(appConfig.apiPrefix, createSystemRouter(deps));

  // Rate limiting
  app.use(createRateLimiter(deps.redisService));

  app.use(`${appConfig.apiPrefix}/webhooks`, createWebhookRouter(deps));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(createRequestLogger(deps.logger));

  app.use(`${appConfig.apiPrefix}/auth`, createAuthRouter({ authService: deps.authService, config: deps.config, redisService: deps.redisService }));
  app.use(`${appConfig.apiPrefix}/users`, createUserRouter({ userService: deps.userService, authService: deps.authService, config: deps.config }));
  app.use(`${appConfig.apiPrefix}/admin/users`, createAdminUserRouter({ adminUserService: deps.adminUserService, userService: deps.userService, authService: deps.authService, config: deps.config }));

  // Admin Catalog Routes
  app.use(`${appConfig.apiPrefix}/admin/categories`, createAdminCategoryRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/brands`, createAdminBrandRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/products`, createAdminProductRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/variants`, createAdminVariantRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/attributes`, createAdminAttributeRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/inventory`, createAdminInventoryRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/media`, createAdminMediaRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/coupons`, createAdminCouponRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/orders`, createAdminOrderRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/shipping`, createAdminShippingRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/settings`, createAdminSettingRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/system`, createAdminSystemRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/reviews`, createAdminReviewRouter(deps));
  app.use(`${appConfig.apiPrefix}/admin/contact-messages`, createAdminContactRouter(deps));

  // Public Catalog Routes
  app.use(`${appConfig.apiPrefix}/categories`, createPublicCategoryRouter(deps));
  app.use(`${appConfig.apiPrefix}/brands`, createPublicBrandRouter(deps));
  app.use(`${appConfig.apiPrefix}/products`, createPublicProductRouter(deps));
  app.use(`${appConfig.apiPrefix}/variants`, createPublicVariantRouter(deps));
  app.use(`${appConfig.apiPrefix}/search`, createPublicSearchRouter(deps));
  app.use(`${appConfig.apiPrefix}/reviews`, createPublicReviewRouter(deps));
  app.use(`${appConfig.apiPrefix}/settings`, createPublicSettingRouter(deps));
  app.use(`${appConfig.apiPrefix}/contact`, createPublicContactRouter(deps));
  
  // Public Workflow Routes
  app.use(`${appConfig.apiPrefix}/cart`, createPublicCartRouter(deps));
  app.use(`${appConfig.apiPrefix}/wishlist`, createPublicWishlistRouter(deps));
  app.use(`${appConfig.apiPrefix}/coupons`, createPublicCouponRouter(deps));
  app.use(`${appConfig.apiPrefix}/orders`, createPublicOrderRouter(deps));
  app.use(`${appConfig.apiPrefix}/shipping`, createPublicShippingRouter(deps));
  app.use(`${appConfig.apiPrefix}/payments`, createPublicPaymentRouter(deps));

  if (deps.config.nodeEnv !== "production") {
    app.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, {
        customSiteTitle: `${appConfig.name} API Docs`,
      }),
    );
    app.use(
      `${appConfig.apiPrefix}/docs`,
      swaggerUi.serve,
      swaggerUi.setup(openApiSpec, {
        customSiteTitle: `${appConfig.name} API Docs`,
      }),
    );

    app.get("/api/docs.json", (_req, res) => {
      res.json(openApiSpec);
    });
    app.get(`${appConfig.apiPrefix}/docs.json`, (_req, res) => {
      res.json(openApiSpec);
    });
  }

  app.use(notFoundHandler);
  app.use(createErrorHandler(deps.logger));

  return app;
}
