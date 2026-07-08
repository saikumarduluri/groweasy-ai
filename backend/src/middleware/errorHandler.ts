import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message =
    err instanceof Error ? err.message : "Unexpected internal server error";

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error]", message, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
