export class IntegrationError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends IntegrationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends IntegrationError {
  constructor(message: string = 'Invalid data provided') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends IntegrationError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class SyncError extends IntegrationError {
  constructor(message: string = 'Sync failed') {
    super(message, 500);
    this.name = 'SyncError';
  }
}

export class ConfigurationError extends IntegrationError {
  constructor(message: string = 'Invalid configuration') {
    super(message, 500);
    this.name = 'ConfigurationError';
  }
}

export function isIntegrationError(error: unknown): error is IntegrationError {
  return error instanceof IntegrationError;
}

export function handleIntegrationError(error: unknown): IntegrationError {
  if (isIntegrationError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new IntegrationError(error.message);
  }

  return new IntegrationError('An unknown error occurred');
} 