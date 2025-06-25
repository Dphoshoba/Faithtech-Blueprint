import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/api-response';

export type NextApiRequestWithUser = NextApiRequest & {
  user?: JwtPayload;
};

type NextApiHandler = (
  req: NextApiRequestWithUser,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Authentication middleware for API routes
 * This middleware will check for a valid JWT token and add the user to the request object
 */
export const withAuth = (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }
    
    // Add the user to the request object
    req.user = user;
    
    // Call the original handler
    return handler(req, res);
  };
};

/**
 * Role-based authentication middleware
 * This middleware will check if the user has the required role
 */
export const withRole = (role: string) => (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }
    
    if (user.role !== role) {
      return sendError(res, 'Forbidden', undefined, 403);
    }
    
    // Add the user to the request object
    req.user = user;
    
    // Call the original handler
    return handler(req, res);
  };
};

/**
 * Admin authentication middleware
 * This is a convenience wrapper around withRole('admin')
 */
export const withAdmin = withRole('admin');

/**
 * Set authentication cookie
 */
export const setAuthCookie = (res: NextApiResponse, token: string): void => {
  res.setHeader(
    'Set-Cookie',
    `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`
  );
};

/**
 * Clear authentication cookie
 */
export const clearAuthCookie = (res: NextApiResponse): void => {
  res.setHeader(
    'Set-Cookie',
    'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
  );
};
