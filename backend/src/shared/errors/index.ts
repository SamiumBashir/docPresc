export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public errors?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden: Access denied', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: any) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict: Resource already exists', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', errors?: any) {
    super(message, 400, code, errors);
  }
}
