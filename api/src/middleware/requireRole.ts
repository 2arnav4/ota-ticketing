import type { RequestHandler } from "express";
import { AppError } from "../domain/errors";
import type { Role } from "../generated/prisma/client";
import { currentUser } from "./userContext";

// Must run after userContext. Authorization on the server; the app hiding the Scan tab is only a convenience.
export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (currentUser(req).role !== role) {
      throw new AppError(403, "FORBIDDEN", "Only gate staff can check tickets in");
    }
    next();
  };
}
