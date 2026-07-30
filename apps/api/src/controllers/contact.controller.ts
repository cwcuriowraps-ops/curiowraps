import { ContactMessageStatus } from "@dashboard/database";
import type { Request, Response } from "express";

import { AppError } from "../middleware/error-handler";
import type { ContactRepository } from "../repositories/contact.repository";

export interface ContactControllerDeps {
  contactRepository: ContactRepository;
}

export function createContactController(deps: ContactControllerDeps) {
  return {
    // Public Endpoint: Submit Contact Form
    submitContactForm: async (req: Request, res: Response) => {
      const { name, email, phone, subject, message } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        throw new AppError(400, "BAD_REQUEST", "Name is required.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        throw new AppError(400, "BAD_REQUEST", "A valid email address is required.");
      }

      if (!message || typeof message !== "string" || !message.trim()) {
        throw new AppError(400, "BAD_REQUEST", "Message content is required.");
      }

      const created = await deps.contactRepository.create({
        name,
        email,
        phone,
        subject,
        message,
      });

      res.status(201).json({
        success: true,
        message: "Thank you for reaching out. We will get back to you within 24 hours.",
        data: { id: created.id },
      });
    },

    // Admin Endpoint: List Messages (Paginated, Search, Status filter)
    listMessages: async (req: Request, res: Response) => {
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const [result, unreadCount] = await Promise.all([
        deps.contactRepository.findMany({ status, search, page, limit }),
        deps.contactRepository.countUnread(),
      ]);

      res.json({
        success: true,
        data: {
          items: result.items,
          meta: result.meta,
          unreadCount,
        },
      });
    },

    // Admin Endpoint: Get Single Message (Auto-mark as READ if UNREAD)
    getMessage: async (req: Request, res: Response) => {
      const id = req.params.id as string;
      let message = await deps.contactRepository.findById(id);

      if (!message) {
        throw new AppError(404, "NOT_FOUND", "Contact message not found.");
      }

      if (message.status === ContactMessageStatus.UNREAD) {
        message = await deps.contactRepository.updateStatus(id, ContactMessageStatus.READ);
      }

      const unreadCount = await deps.contactRepository.countUnread();

      res.json({
        success: true,
        data: { message, unreadCount },
      });
    },

    // Admin Endpoint: Update Message Status (UNREAD, READ, REPLIED, ARCHIVED)
    updateStatus: async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!status || !Object.values(ContactMessageStatus).includes(status as any)) {
        throw new AppError(400, "BAD_REQUEST", "Valid status (UNREAD, READ, REPLIED, ARCHIVED) is required.");
      }

      const existing = await deps.contactRepository.findById(id);
      if (!existing) {
        throw new AppError(404, "NOT_FOUND", "Contact message not found.");
      }

      const updated = await deps.contactRepository.updateStatus(id, status as ContactMessageStatus);
      const unreadCount = await deps.contactRepository.countUnread();

      res.json({
        success: true,
        message: `Message status updated to ${status}.`,
        data: { message: updated, unreadCount },
      });
    },

    // Admin Endpoint: Delete Message
    deleteMessage: async (req: Request, res: Response) => {
      const id = req.params.id as string;
      const existing = await deps.contactRepository.findById(id);

      if (!existing) {
        throw new AppError(404, "NOT_FOUND", "Contact message not found.");
      }

      await deps.contactRepository.delete(id);
      const unreadCount = await deps.contactRepository.countUnread();

      res.json({
        success: true,
        message: "Contact message deleted successfully.",
        data: { unreadCount },
      });
    },

    // Admin Endpoint: Get Unread Count for Sidebar Badge
    getUnreadCount: async (req: Request, res: Response) => {
      const unreadCount = await deps.contactRepository.countUnread();
      res.json({
        success: true,
        data: { unreadCount },
      });
    },
  };
}
