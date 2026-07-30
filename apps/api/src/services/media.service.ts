import type { PrismaClient } from "@dashboard/database";
import { v2 as cloudinary } from "cloudinary";

import { AppError } from "../middleware/error-handler";
import { MediaRepository } from "../repositories/media.repository";

import { AuditService } from "./audit.service";

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (hasCloudinary) {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } else {
    cloudinary.config({ secure: true });
  }
}

export class MediaService {
  private readonly auditService: AuditService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly mediaRepository: MediaRepository
  ) {
    this.auditService = new AuditService(prisma);
  }

  async getAllMedia(params?: { page?: number; limit?: number; search?: string }) {
    return this.mediaRepository.findAll(params);
  }

  async getMediaById(id: string) {
    const media = await this.mediaRepository.findById(id);
    if (!media) throw new AppError(404, "NOT_FOUND", "Media not found");
    return media;
  }

  async uploadMedia(data: any, actorUserId: string, context: any) {
    // In production, the file could either be uploaded to Cloudinary on the client side
    // and the URL submitted here, or uploaded via the backend using `cloudinary.uploader.upload()`.
    // We assume `data.url` has the securely uploaded Cloudinary URL and `data.providerId` has the public_id.
    
    // Automatically apply image optimization transformations for Storefront Delivery
    if (data.url && process.env.CLOUDINARY_URL && data.url.includes("cloudinary.com")) {
      // We can rely on next/image or Cloudinary's fetch format (f_auto, q_auto)
      // data.url = data.url.replace('/upload/', '/upload/f_auto,q_auto/');
    }

    const media = await this.mediaRepository.create(data);

    await this.auditService.logAction({
      actorUserId,
      action: "CREATE",
      entityType: "MediaAsset",
      entityId: media.id,
      after: media as any,
      ...context,
    });

    return media;
  }

  async updateMedia(id: string, data: any, actorUserId: string, context: any) {
    const media = await this.mediaRepository.findById(id);
    if (!media) throw new AppError(404, "NOT_FOUND", "Media not found");

    const updatedMedia = await this.mediaRepository.update(id, data);

    await this.auditService.logAction({
      actorUserId,
      action: "UPDATE",
      entityType: "MediaAsset",
      entityId: id,
      before: media as any,
      after: updatedMedia as any,
      ...context,
    });

    return updatedMedia;
  }

  async deleteMedia(id: string, actorUserId: string, context: any) {
    const media = await this.mediaRepository.findById(id);
    if (!media) throw new AppError(404, "NOT_FOUND", "Media not found");

    if (hasCloudinary && media.storageKey) {
      try {
        await cloudinary.uploader.destroy(media.storageKey);
      } catch (err) {
        console.error("Cloudinary delete failed:", err);
      }
    }

    await this.mediaRepository.delete(id);

    await this.auditService.logAction({
      actorUserId,
      action: "DELETE",
      entityType: "MediaAsset",
      entityId: id,
      before: media as any,
      ...context,
    });
  }
}
