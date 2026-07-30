import { appConfig } from "@dashboard/config";
import pino, { type Logger } from "pino";

import type { ApiConfig } from "../config";

export function createLogger(config: ApiConfig): Logger {
  return pino({
    enabled: config.nodeEnv !== "test",
    level: config.logLevel,
    base: {
      service: `${appConfig.name.toLowerCase()}-api`,
      app: appConfig.name,
      version: appConfig.apiVersion,
      env: config.nodeEnv,
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "passwordHash",
        "token",
        "accessToken",
        "refreshToken",
        "newPassword",
        "creditCard",
        "cvv",
      ],
      censor: "[REDACTED]",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}