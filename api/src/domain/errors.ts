// Every non-2xx response the API sends on purpose is an AppError. The error handler turns it into
// { error: { code, message, details } }. Clients branch on `code`, never on `message`.
export type ErrorCode =
  | "MISSING_USER_ID"
  | "INVALID_USER_ID"
  | "UNKNOWN_USER"
  | "NOT_FOUND"
  | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}
