import type { ErrorRequestHandler, RequestHandler } from "express";

// Step 3 replaces this with AppError codes. The body shape is fixed now so clients never see another one.
function errorBody(code: string, message: string) {
  return { error: { code, message, details: {} } };
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody("NOT_FOUND", "Route not found"));
};

// body-parser marks its own failures with `type`; everything else is an unexpected 500 with no stack in the body.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err?.type === "entity.too.large") {
    res.status(413).json(errorBody("PAYLOAD_TOO_LARGE", "Request body is too large"));
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json(errorBody("INVALID_JSON", "Request body is not valid JSON"));
    return;
  }
  req.log.error({ err }, "unhandled error");
  res.status(500).json(errorBody("INTERNAL", "Something went wrong"));
};
