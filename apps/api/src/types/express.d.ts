import type { PublicUser } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      authUser?: PublicUser;
    }
  }
}

export {};