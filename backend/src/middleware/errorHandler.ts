import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json({
      success: false,
      message: errorMessages || 'Validation error',
      errors: err.errors,
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    res.status(409).json({
      success: false,
      message: `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Item'} already exists.`,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
