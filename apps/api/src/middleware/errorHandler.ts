import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  if (process.env.NODE_ENV !== 'test' && status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
  }

  res.status(status).json({
    error: message,
    details: err.details || undefined,
  });
}
