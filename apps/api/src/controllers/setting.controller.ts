import type { Request, Response } from "express";

import { AppError } from "../middleware/error-handler";
import type { SettingRepository } from "../repositories/setting.repository";
import type { CartService } from "../services/cart.service";
import type { NotificationService } from "../services/notification.service";

export interface SettingControllerDeps {
  settingRepository: SettingRepository;
  notificationService?: NotificationService;
  cartService?: CartService;
}

let cachedSettingsMap: Record<string, any> | null = null;
let settingsCacheExpiresAt = 0;

export function invalidateSettingsCache() {
  cachedSettingsMap = null;
  settingsCacheExpiresAt = 0;
}

export function createSettingController(deps: SettingControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const keys = req.query.keys ? (req.query.keys as string).split(",") : [];
      
      // If requesting all settings or standard public set, serve from cache if fresh
      if (keys.length === 0 && cachedSettingsMap && Date.now() < settingsCacheExpiresAt) {
        return res.json({ success: true, data: { settings: cachedSettingsMap } });
      }

      let settings;
      if (keys.length > 0) {
        settings = await deps.settingRepository.findByKeys(keys);
      } else {
        settings = await deps.settingRepository.findAll();
      }

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      if (keys.length === 0) {
        cachedSettingsMap = settingsMap;
        settingsCacheExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL
      }

      res.json({ success: true, data: { settings: settingsMap } });
    },

    updateSettings: async (req: Request, res: Response) => {
      const settingsToUpdate = req.body.settings;
      if (!settingsToUpdate || typeof settingsToUpdate !== "object") {
        throw new AppError(400, "BAD_REQUEST", "Settings payload must be an object of key-value pairs");
      }

      const userId = req.authUser!.id;

      const formattedSettings = Object.entries(settingsToUpdate).map(([key, value]) => ({
        key,
        value,
      }));

      await deps.settingRepository.bulkUpsert(formattedSettings, userId);

      // Invalidate settings cache immediately so changes reflect instantly
      invalidateSettingsCache();
      deps.cartService?.invalidateSettingsCache?.();

      const updatedSettings = await deps.settingRepository.findAll();
      const settingsMap = updatedSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);

      res.json({ success: true, data: { settings: settingsMap } });
    },

    getEmailSettings: async (req: Request, res: Response) => {
      const setting = await deps.settingRepository.findByKey("email_settings");
      const fallbackSenderEmail = process.env.EMAIL_FROM || "cw.curiowraps@gmail.com";
      const fallbackSenderName = process.env.EMAIL_SENDER_NAME || "Curio Wraps";

      if (setting && setting.value && typeof setting.value === "object") {
        const val = setting.value as any;
        return res.json({
          success: true,
          data: {
            senderName: val.senderName || fallbackSenderName,
            senderEmail: val.senderEmail || fallbackSenderEmail,
            replyToEmail: val.replyToEmail || "",
          },
        });
      }

      res.json({
        success: true,
        data: {
          senderName: fallbackSenderName,
          senderEmail: fallbackSenderEmail,
          replyToEmail: "",
        },
      });
    },

    updateEmailSettings: async (req: Request, res: Response) => {
      const { senderName, senderEmail, replyToEmail } = req.body;

      if (!senderName || typeof senderName !== "string" || !senderName.trim()) {
        throw new AppError(400, "BAD_REQUEST", "Sender Name is required.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!senderEmail || typeof senderEmail !== "string" || !emailRegex.test(senderEmail.trim())) {
        throw new AppError(400, "BAD_REQUEST", "A valid Sender Email address is required.");
      }

      if (replyToEmail && (typeof replyToEmail !== "string" || !emailRegex.test(replyToEmail.trim()))) {
        throw new AppError(400, "BAD_REQUEST", "Reply-To Email must be a valid email address.");
      }

      const userId = req.authUser?.id;
      const payload = {
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim().toLowerCase(),
        replyToEmail: replyToEmail ? replyToEmail.trim().toLowerCase() : "",
      };

      await deps.settingRepository.upsert("email_settings", payload, userId);

      if (deps.notificationService) {
        deps.notificationService.updateEmailSettings(payload.senderName, payload.senderEmail, payload.replyToEmail);
      }

      res.json({
        success: true,
        message: "Email settings updated successfully.",
        data: payload,
      });
    },

    sendTestEmail: async (req: Request, res: Response) => {
      const adminUser = req.authUser;
      if (!adminUser || !adminUser.email) {
        throw new AppError(401, "UNAUTHORIZED", "Authenticated admin account required.");
      }

      const targetEmail = req.body.targetEmail || adminUser.email;
      const adminName = adminUser.firstName || "Admin";

      if (!deps.notificationService) {
        throw new AppError(500, "EMAIL_SERVICE_ERROR", "Notification Service is not configured.");
      }

      try {
        await deps.notificationService.sendTestEmail(targetEmail, adminName);
        res.json({
          success: true,
          message: `Test email sent successfully to ${targetEmail}. Please check your inbox.`,
        });
      } catch (error: any) {
        const errMsg = error?.message || "Failed to send test email.";
        throw new AppError(500, "EMAIL_SEND_FAILED", `Email delivery failed: ${errMsg}`);
      }
    },
  };
}
