import { Router } from "express";

import type { ApiDependencies } from "../context";

export function createWebhookRouter(_deps: ApiDependencies): Router {
  const router = Router();
  return router;
}
