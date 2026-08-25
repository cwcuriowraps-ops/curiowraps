const KNOWN_ERRORS = {
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested item was not found.",
  CONFLICT: "This item already exists.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  TOKEN_EXPIRED: "Your session or link has expired. Please try again.",
  EMAIL_SEND_FAILED: "Unable to send email. Please try again later.",
} as const;

type KnownErrorCode = keyof typeof KNOWN_ERRORS;

/**
 * Sanitizes raw API errors, preventing database exceptions, stack traces,
 * or raw error objects from being presented to end users.
 */
export function sanitizeErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  if (typeof error === "string") {
    const lower = error.toLowerCase();
    if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
      return KNOWN_ERRORS.NETWORK_ERROR;
    }
    if (lower.includes("jwt") || lower.includes("token") || lower.includes("expired")) {
      return KNOWN_ERRORS.TOKEN_EXPIRED;
    }
    // Return friendly string if short and not technical
    if (error.length < 80 && !lower.includes("prisma") && !lower.includes("sql") && !lower.includes("stack") && !lower.includes("internal")) {
      return error;
    }
    return fallback;
  }

  if (typeof error === "object") {
    const err = error as any;
    const code = (err?.code || err?.data?.error?.code || "") as string;
    if (code && code in KNOWN_ERRORS) {
      return KNOWN_ERRORS[code as KnownErrorCode];
    }

    const message = err?.message || err?.data?.message || err?.data?.error?.message;
    if (typeof message === "string") {
      const lower = message.toLowerCase();
      if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("econnrefused")) {
        return KNOWN_ERRORS.NETWORK_ERROR;
      }
      if (lower.includes("invalid password") || lower.includes("invalid credentials")) {
        return KNOWN_ERRORS.INVALID_CREDENTIALS;
      }
      if (lower.includes("token") && (lower.includes("expired") || lower.includes("invalid"))) {
        return KNOWN_ERRORS.TOKEN_EXPIRED;
      }
      if (message.length < 80 && !lower.includes("prisma") && !lower.includes("sql") && !lower.includes("stack") && !lower.includes("internal") && !lower.includes("object") && !lower.includes("exception")) {
        return message;
      }
    }
  }

  return fallback;
}
