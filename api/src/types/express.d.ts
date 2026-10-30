import type { User } from "../generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Set by userContext. Present on every route mounted after it. */
      user?: User;
    }
  }
}

export {};
