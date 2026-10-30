import { prisma } from "../db/prisma";
import type { User } from "../generated/prisma/client";

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
