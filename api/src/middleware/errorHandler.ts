import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../domain/errors";

function errorBody(error: AppError) {
  return { error: { code: error.code, message: error.message, details: error.details } };
}

export const notFound: RequestHandler = () => {
  throw new AppError(404, "NOT_FOUND", "Route not found");
};

// Order matters: known AppErrors first, then body-parser's tagged failures, then everything else as an opaque 500.
// Prisma and driver errors fall into the last branch, so their messages never reach the client.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(errorBody(err));
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json(errorBody(new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large")));
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json(errorBody(new AppError(400, "INVALID_JSON", "Request body is not valid JSON")));
    return;
  }
  req.log.error({ err }, "unhandled error");
  res.status(500).json(errorBody(new AppError(500, "INTERNAL", "Something went wrong")));
};
