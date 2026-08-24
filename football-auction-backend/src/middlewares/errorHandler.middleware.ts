import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: any[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('💥 Global Error Handler:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    const errorDetails = err.issues
      .map((e: any) => {
        const field = e.path.filter((p: any) => p !== 'body').join('.') || 'input';
        return `${field}: ${e.message}`;
      })
      .join(', ');

    return res.status(400).json({
      success: false,
      message: errorDetails ? `Validation failed (${errorDetails})` : 'Validation failed',
      errors: err.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
