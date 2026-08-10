import crypto from "node:crypto";

import appleSignin from "apple-signin-auth";
import { OAuth2Client } from "google-auth-library";
import type { Logger } from "pino";


import type { LoginInput, PublicUser, RegisterInput } from "../auth/types";
import type { ApiConfig } from "../config";
import { durationToMs, hashToken, signJwt, verifyJwt, type JwtPayloadBase } from "../lib/jwt";
import { createTokenId } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { AppError } from "../middleware/error-handler";
import { RefreshTokenRepository } from "../repositories/refresh-token.repository";
import { RoleRepository } from "../repositories/role.repository";
import { UserRepository } from "../repositories/user.repository";


import type { QueueService } from "./queue.service";

interface AuthDependencies {
  config: ApiConfig;
  logger: Logger;
  prisma: any;
  queueService?: QueueService;
}

interface TokenContext {
  ipAddress?: string;
  userAgent?: string;
}

interface RefreshPayload extends JwtPayloadBase {
  userId: string;
}

interface AccessPayload extends JwtPayloadBase {
  userId: string;
  email: string;
  role: string;
}

function toPublicUser(user: any): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    permissions: user.role?.permissions?.map((p: any) => p.permission.code) || [],
    emailVerified: Boolean(user.emailVerifiedAt),
    avatarUrl: user.avatarUrl,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
    gender: user.gender,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly roleRepository: RoleRepository;
  private readonly refreshTokenRepository: RefreshTokenRepository;
  private readonly googleClient: OAuth2Client;

  constructor(private readonly deps: AuthDependencies) {
    this.userRepository = new UserRepository(deps.prisma);
    this.roleRepository = new RoleRepository(deps.prisma);
    this.refreshTokenRepository = new RefreshTokenRepository(deps.prisma);
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(input: RegisterInput, context: TokenContext = {}) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "An account with that email already exists");
    }

    const passwordHash = await hashPassword(input.password, this.deps.config.bcryptRounds);

    const customerRole = await this.roleRepository.ensureCustomerRole();

    const user = await this.deps.prisma.$transaction(async (transaction: any) => {
      const userRepository = new UserRepository(transaction);
      return userRepository.create({
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: { connect: { id: customerRole.id } },
      });
    }, { maxWait: 30000, timeout: 60000 });

    const tokens = this.buildTokens(user.id, user.email, user.role.name);
    await this.storeRefreshToken(this.deps.prisma, user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt, context);
    await this.userRepository.updateLastLoginAt(user.id, new Date());

    const result = { user: toPublicUser(user), tokens };

    if (this.deps.queueService) {
      this.deps.queueService.sendEmail("WELCOME_EMAIL", {
        email: result.user.email,
        firstName: result.user.firstName,
      }).catch((err) => {
        this.deps.logger.error({ err }, "Failed to queue welcome email");
      });
    }

    return result;
  }

  async oauthLogin(provider: "GOOGLE" | "APPLE", idToken: string, context: TokenContext = {}) {
    let email = "";
    let firstName = "";
    let lastName = "";
    let avatarUrl = "";
    let providerId = "";

    try {
      if (provider === "GOOGLE") {
        const ticket = await this.googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) throw new AppError(401, "INVALID_TOKEN", "Invalid Google token");
        email = payload.email.toLowerCase().trim();
        firstName = payload.given_name || "";
        lastName = payload.family_name || "";
        avatarUrl = payload.picture || "";
        providerId = payload.sub;
      } else if (provider === "APPLE") {
        const payload = await appleSignin.verifyIdToken(idToken, {
          audience: process.env.APPLE_CLIENT_ID,
        });
        if (!payload || !payload.email) throw new AppError(401, "INVALID_TOKEN", "Invalid Apple token");
        email = payload.email.toLowerCase().trim();
        providerId = payload.sub;
        // Apple only sends name on first login, which requires frontend to pass it if we want it.
        // We will default to empty strings if not provided.
      }
    } catch (err: any) {
      this.deps.logger.error({ err }, `Failed to verify ${provider} token`);
      throw new AppError(401, "INVALID_TOKEN", `Failed to verify ${provider} token`);
    }

    let user = await this.userRepository.findByEmail(email);

    const result = await this.deps.prisma.$transaction(
      async (transaction: any) => {
        const roleRepository = new RoleRepository(transaction);
        const userRepository = new UserRepository(transaction);

        if (!user) {
          const customerRole = await roleRepository.ensureCustomerRole();
          user = await userRepository.create({
            email,
            firstName: firstName || "User",
            lastName: lastName || "",
            avatarUrl,
            provider,
            providerId,
            role: { connect: { id: customerRole.id } },
          });

          // Also update emailVerifiedAt
          await transaction.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date() },
          });
        } else {
          // Link account if not linked
          if (!user.provider || user.provider === "LOCAL") {
            await transaction.user.update({
              where: { id: user.id },
              data: { provider, providerId, emailVerifiedAt: user.emailVerifiedAt || new Date() },
            });
          }
        }

        if (user.deletedAt || user.status !== "ACTIVE") {
          throw new AppError(401, "ACCOUNT_DISABLED", "Your account has been disabled");
        }

        const tokens = this.buildTokens(user.id, user.email, user.role.name);
        await this.storeRefreshToken(transaction, user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt, context);
        await userRepository.updateLastLoginAt(user.id, new Date());

        return { user: toPublicUser(user), tokens };
      },
      { maxWait: 15000, timeout: 20000 }
    );

    return result;
  }

  async login(input: LoginInput, context: TokenContext = {}) {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "No account found with this email.");
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "INCORRECT_PASSWORD", "Incorrect password. Please try again.");
    }

    const tokens = this.buildTokens(user.id, user.email, user.role.name);
    await this.storeRefreshToken(this.deps.prisma, user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt, context);
    await this.userRepository.updateLastLoginAt(user.id, new Date());

    return { user: toPublicUser(user), tokens };
  }

  async refresh(refreshToken: string, context: TokenContext = {}) {
    const payload = this.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken, this.deps.config.jwtRefreshSecret);
    const existingToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken || existingToken.expiresAt < new Date()) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
    }

    // Concurrent Refresh Protection: 10-second rotation grace window
    if (existingToken.revokedAt || existingToken.replacedByTokenId) {
      const REFRESH_TOKEN_GRACE_WINDOW_MS = 10_000;
      const revokedAtMs = existingToken.revokedAt ? new Date(existingToken.revokedAt).getTime() : 0;
      const timeSinceRevocation = Date.now() - revokedAtMs;

      if (existingToken.revokedAt && timeSinceRevocation >= 0 && timeSinceRevocation <= REFRESH_TOKEN_GRACE_WINDOW_MS) {
        const user = await this.userRepository.findById(payload.userId);
        if (user && !user.deletedAt && user.status === "ACTIVE") {
          const tokens = this.buildTokens(user.id, user.email, user.role.name);
          return { user: toPublicUser(user), tokens };
        }
      }

      throw new AppError(401, "REFRESH_TOKEN_REUSED", "Refresh token has already been rotated");
    }

    const user = await this.userRepository.findById(payload.userId);

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
    }

    const result = await this.deps.prisma.$transaction(
      async (transaction: any) => {
        const refreshTokenRepository = new RefreshTokenRepository(transaction);
        const userRepository = new UserRepository(transaction);

        const updateResult = await refreshTokenRepository.revokeById(existingToken.id, new Date(), undefined);
        if (updateResult.count !== 1) {
          throw new AppError(401, "REFRESH_TOKEN_REUSED", "Refresh token has already been rotated");
        }

        const tokens = this.buildTokens(user.id, user.email, user.role.name);
        const createResult = await this.storeRefreshToken(transaction, user.id, tokens.refreshToken, tokens.refreshTokenExpiresAt, context);

        await transaction.refreshToken.update({ where: { id: existingToken.id }, data: { replacedByTokenId: createResult.id } });

        await userRepository.updateLastLoginAt(user.id, new Date());

        return { user: toPublicUser(user), tokens };
      },
      { maxWait: 15000, timeout: 20000 }
    );

    return result;
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken, this.deps.config.jwtRefreshSecret);
    await this.refreshTokenRepository.revokeByHash(tokenHash, new Date());
  }

  async forgotPassword(email: string) {
    const startTime = Date.now();
    const normalizedEmail = email.toLowerCase().trim();
    this.deps.logger.info(
      { email: normalizedEmail, timestamp: new Date().toISOString() },
      "[ForgotPassword][AuthService][Step:Entered]"
    );

    try {
      // 1. User Lookup
      const userLookupStart = Date.now();
      const user = await this.userRepository.findByEmail(normalizedEmail);
      const userLookupTimeMs = Date.now() - userLookupStart;

      if (!user || user.deletedAt || user.status !== "ACTIVE") {
        this.deps.logger.warn(
          { email: normalizedEmail, userExists: Boolean(user), userLookupTimeMs },
          "[ForgotPassword][AuthService][Step:UserNotFound]"
        );
        throw new AppError(404, "ACCOUNT_NOT_FOUND", "No account found with this email.");
      }

      this.deps.logger.info(
        { userId: user.id, email: user.email, firstName: user.firstName, userLookupTimeMs },
        "[ForgotPassword][AuthService][Step:UserFound]"
      );

      // 2. Token Generation
      const tokenGenStart = Date.now();
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const tokenGenTimeMs = Date.now() - tokenGenStart;

      this.deps.logger.info(
        { userId: user.id, tokenHash, expiresAt, tokenGenTimeMs },
        "[ForgotPassword][ResetToken][Step:TokenGenerated]"
      );

      // 3. Token Persistence
      const dbSaveStart = Date.now();
      await this.deps.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
      const dbSaveTimeMs = Date.now() - dbSaveStart;

      this.deps.logger.info(
        { userId: user.id, dbSaveTimeMs },
        "[ForgotPassword][ResetToken][Step:TokenSaved]"
      );

      // 4. Reset URL Generation
      const frontendUrl = this.deps.config.storefrontUrl || process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
      this.deps.logger.info(
        { email: user.email, resetLink, frontendUrl },
        "[ForgotPassword][EmailPayload][Step:PayloadGenerated]"
      );

      // 5. Dispatch Email to the EXACT intended recipient
      if (this.deps.queueService) {
        const emailDispatchStart = Date.now();
        this.deps.logger.info(
          { recipient: user.email, resetLink },
          "[ForgotPassword][AuthService][Step:DispatchingEmail]"
        );

        try {
          await this.deps.queueService.sendEmail("FORGOT_PASSWORD", {
            email: user.email,
            firstName: user.firstName,
            resetLink,
          });
          const emailDispatchTimeMs = Date.now() - emailDispatchStart;
          this.deps.logger.info(
            { recipient: user.email, emailDispatchTimeMs },
            "[ForgotPassword][AuthService][Step:EmailSuccess]"
          );
        } catch (emailError: any) {
          const emailDispatchTimeMs = Date.now() - emailDispatchStart;
          this.deps.logger.error(
            { err: emailError, stack: emailError?.stack, recipient: user.email, emailDispatchTimeMs },
            "[ForgotPassword][AuthService][Step:EmailFailed]"
          );
          throw new AppError(500, "EMAIL_SEND_FAILED", "Failed to send password reset email. Please try again later.");
        }
      } else {
        this.deps.logger.warn(
          { recipient: user.email },
          "[ForgotPassword][AuthService][Step:NoEmailServiceConfigured]"
        );
      }

      const totalExecutionTimeMs = Date.now() - startTime;
      this.deps.logger.info(
        { recipient: user.email, totalExecutionTimeMs },
        "[ForgotPassword][AuthService][Step:Completed]"
      );
    } catch (error: any) {
      const totalExecutionTimeMs = Date.now() - startTime;
      this.deps.logger.error(
        { err: error, stack: error?.stack, totalExecutionTimeMs },
        "[ForgotPassword][AuthService][Step:Exception]"
      );
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await this.deps.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.consumedAt || resetToken.expiresAt < new Date()) {
      throw new AppError(400, "INVALID_TOKEN", "Reset token is invalid or expired");
    }

    const user = resetToken.user;
    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new AppError(400, "INVALID_TOKEN", "User account is disabled or deleted");
    }

    const passwordHash = await hashPassword(newPassword, this.deps.config.bcryptRounds);

    await this.deps.prisma.$transaction(async (transaction: any) => {
      // Mark token as consumed
      await transaction.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { consumedAt: new Date() },
      });

      // Update password
      await transaction.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Revoke all existing refresh tokens for security
      await transaction.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }, { maxWait: 10000, timeout: 20000 });
  }

  verifyAccessToken(accessToken: string) {
    return verifyJwt<AccessPayload>(accessToken, this.deps.config.jwtAccessSecret);
  }

  async getCurrentUser(accessToken: string) {
    const payload = this.verifyAccessToken(accessToken);
    const user = await this.userRepository.findById(payload.userId);

    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      throw new AppError(401, "INVALID_TOKEN", "The access token is invalid or expired");
    }

    return toPublicUser(user);
  }

  private verifyRefreshToken(refreshToken: string) {
    return verifyJwt<RefreshPayload>(refreshToken, this.deps.config.jwtRefreshSecret);
  }

  private buildTokens(userId: string, email: string, role: string) {
    const accessToken = signJwt(
      {
        sub: userId,
        userId,
        email,
        role,
        jti: createTokenId(),
        tokenType: "access",
      },
      this.deps.config.jwtAccessSecret,
      this.deps.config.jwtAccessExpiresIn,
    );

    const refreshTokenId = createTokenId();
    const refreshToken = signJwt(
      {
        sub: userId,
        userId,
        jti: refreshTokenId,
        tokenType: "refresh",
      },
      this.deps.config.jwtRefreshSecret,
      this.deps.config.jwtRefreshExpiresIn,
    );

    const refreshTokenExpiresAt = new Date(Date.now() + durationToMs(this.deps.config.jwtRefreshExpiresIn));

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  private async storeRefreshToken(
    transaction: any,
    userId: string,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
    context: TokenContext,
  ) {
    const tokenHash = hashToken(refreshToken, this.deps.config.jwtRefreshSecret);

    return transaction.refreshToken.create({
      data: {
        tokenHash,
        expiresAt: refreshTokenExpiresAt,
        user: { connect: { id: userId } },
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
    });
  }
}
