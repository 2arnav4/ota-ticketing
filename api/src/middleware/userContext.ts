import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../domain/errors";
import type { User } from "../generated/prisma/client";
import { findUserById } from "../services/userService";

const UserIdHeader = z.uuid();

// Demo identity, NOT authentication: the brief excludes login, so anyone can send any seeded user's ID.
// 400 = header missing or malformed (client bug); 401 = well-formed but no such user.
export const userContext: RequestHandler = async (req, _res, next) => {
  const raw = req.header("x-user-id");
  if (!raw) {
    throw new AppError(400, "MISSING_USER_ID", "X-User-Id header is required");
  }
  const parsed = UserIdHeader.safeParse(raw);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_USER_ID", "X-User-Id must be a UUID");
  }
  const user = await findUserById(parsed.data);
  if (!user) {
    throw new AppError(401, "UNKNOWN_USER", "No user with this X-User-Id");
  }
  req.user = user;
  next();
};

// For handlers mounted after userContext. Throwing here means a route was wired without it: a server bug.
export function currentUser(req: Request): User {
  if (!req.user) {
    throw new Error("currentUser() called on a route without userContext");
  }
  return req.user;
}
