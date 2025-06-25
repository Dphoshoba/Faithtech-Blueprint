import { NextApiResponse } from 'next';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export function sendSuccess<T>(
  res: NextApiResponse,
  data?: T,
  message: string = 'Success',
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

export function sendError(
  res: NextApiResponse,
  message: string = 'An error occurred',
  errors?: string[],
  statusCode: number = 400
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

export function handleApiError(
  res: NextApiResponse,
  error: unknown,
  defaultMessage: string = 'Internal server error'
) {
  console.error('API Error:', error);
  
  // Handle known error types
  if (error instanceof Error) {
    return sendError(res, error.message, undefined, 500);
  }
  
  // Handle unknown errors
  return sendError(res, defaultMessage, undefined, 500);
}
