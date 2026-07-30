import path from "path";

import type { Request, Response } from "express";

import type { MediaService } from "../services/media.service";

export interface MediaControllerDeps {
  mediaService: MediaService;
}

export function createMediaController(deps: MediaControllerDeps) {
  return {
    getAll: async (req: Request, res: Response) => {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await deps.mediaService.getAllMedia({ page, limit, search });
      res.json({ success: true, data: { media: result.items }, meta: result.meta });
    },

    getById: async (req: Request, res: Response) => {
      const media = await deps.mediaService.getMediaById(req.params.id as string);
      res.json({ success: true, data: { media } });
    },

    upload: async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: "No file uploaded" } });
      }

      const hasCloudinary = Boolean(
        process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
      );

      let publicUrl = req.file.path;
      if (!hasCloudinary || !publicUrl?.startsWith("http")) {
        const apiOrigin = (process.env.API_URL || "http://localhost:4000").replace(/\/api\/v1\/?$/, "");
        publicUrl = `${apiOrigin}/uploads/${encodeURIComponent(req.file.filename || path.basename(req.file.path))}`;
      }

      const key = req.file.filename || (req.file as any).public_id || publicUrl;
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const fileData = {
        publicUrl,
        storageKey: key,
        checksum: `${key}-${uniqueSuffix}`,
        mimeType: req.file.mimetype,
        sizeInBytes: req.file.size || 0,
        title: req.file.originalname,
        type: "IMAGE"
      };

      const userId = req.authUser?.id || (req as any).user?.id || null;

      try {
        const media = await deps.mediaService.uploadMedia(fileData, userId, {
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        });
        return res.status(201).json({ success: true, data: { mediaAsset: media } });
      } catch (err: any) {
        console.error("[MediaController] DB save failed, cleaning up uploaded asset if present:", err);
        // Attempt orphan cleanup on Cloudinary if needed
        if (hasCloudinary && key) {
          try {
            const { v2: cloudinary } = await import("cloudinary");
            await cloudinary.uploader.destroy(key).catch(() => null);
          } catch {
            // Ignore Cloudinary cleanup errors
          }
        }
        return res.status(500).json({
          success: false,
          error: { code: "MEDIA_UPLOAD_FAILED", message: err.message || "Failed to persist media asset" }
        });
      }
    },

    update: async (req: Request, res: Response) => {
      const media = await deps.mediaService.updateMedia(req.params.id as string, req.body, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { media } });
    },

    delete: async (req: Request, res: Response) => {
      await deps.mediaService.deleteMedia(req.params.id as string, req.authUser!.id, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
      res.json({ success: true, data: { message: "Media deleted successfully" } });
    },
  };
}
