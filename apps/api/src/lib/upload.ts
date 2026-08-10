import crypto from "crypto";
import fs from "fs";
import path from "path";

import { v2 as cloudinary } from "cloudinary";
import type { Express } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

class ResilientStorage implements multer.StorageEngine {
  private cloudinaryStorage?: multer.StorageEngine;
  private diskStorage: multer.StorageEngine;

  constructor(hasCloudinary: boolean) {
    this.diskStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedBase = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, "_");
        cb(null, `${crypto.randomBytes(8).toString("hex")}-${sanitizedBase}${ext}`);
      },
    });

    if (hasCloudinary) {
      try {
        this.cloudinaryStorage = new CloudinaryStorage({
          cloudinary: cloudinary,
          params: {
            folder: "curio-wrap",
            allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"],
          } as any,
        });
      } catch (err) {
        console.warn("[Storage] CloudinaryStorage initialization failed, defaulting to local disk:", err);
      }
    }
  }

  _handleFile(req: any, file: any, cb: (error?: any, info?: Partial<Express.Multer.File>) => void): void {
    if (this.cloudinaryStorage) {
      this.cloudinaryStorage._handleFile(req, file, (err, info) => {
        if (err) {
          console.warn("[Storage] Cloudinary upload returned error:", err.message || err);
          if (process.env.NODE_ENV === "production") {
            return cb(new Error(`Cloudinary media upload failed: ${err.message || err}`));
          }
          console.warn("[Storage] Falling back to local disk (development mode only)");
          return this.diskStorage._handleFile(req, file, cb);
        }
        cb(null, info);
      });
    } else {
      if (process.env.NODE_ENV === "production") {
        return cb(new Error("Cloudinary storage is not configured in production environment"));
      }
      this.diskStorage._handleFile(req, file, cb);
    }
  }

  _removeFile(req: any, file: any, cb: (error: Error | null) => void): void {
    if (this.cloudinaryStorage) {
      this.cloudinaryStorage._removeFile(req, file, (err) => {
        if (err) {
          return this.diskStorage._removeFile(req, file, cb);
        }
        cb(null);
      });
    } else {
      this.diskStorage._removeFile(req, file, cb);
    }
  }
}

const storage = new ResilientStorage(hasCloudinary);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
]);

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`));
    }
  },
});
