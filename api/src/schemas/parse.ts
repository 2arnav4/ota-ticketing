import { z } from "zod";
import { AppError } from "../domain/errors";

// The single boundary between untrusted input and typed values. Services only ever see parsed data.
export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_FAILED", "Request is invalid", {
      issues: result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  return result.data;
}
