import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import cookie from 'cookie';

// This should be stored in an environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
  userId?: string;
  id?: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Get the JWT token from cookies in the request
 */
export const getTokenFromRequest = (req: NextApiRequest): string | null => {
  // Check for cookies
  if (req.headers.cookie) {
    const parsedCookies = cookie.parse(req.headers.cookie);
    return parsedCookies.token || null;
  }
  
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

/**
 * Get the user from the request
 */
export const getUserFromRequest = (req: NextApiRequest): JwtPayload | null => {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  return verifyToken(token);
};
