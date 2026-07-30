import { randomUUID, createHmac } from "node:crypto";

import jwt from "jsonwebtoken";

export interface JwtPayloadBase {
  sub: string;
  jti: string;
  tokenType: "access" | "refresh";
}

export function signJwt(payload: Record<string, unknown>, secret: string, expiresIn: string) {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
}

export function verifyJwt<T extends object>(token: string, secret: string) {
  return jwt.verify(token, secret, { algorithms: ["HS256"] }) as T;
}

export function createTokenId() {
  return randomUUID();
}

export function hashToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function durationToMs(value: string) {
  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit as "ms" | "s" | "m" | "h" | "d"];

  return amount * multiplier;
}
