import type { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError, handleApiError } from '../../../../utils/api-response';
import { generateToken } from '../../../../utils/jwt';
import { setAuthCookie } from '../../../../middleware/auth';

// In a real application, this would be stored in a database with hashed passwords
const ADMIN_USERS = [
  {
    id: '1',
    email: 'admin@faithtech.com',
    password: 'admin123', // In a real app, this would be hashed
    name: 'Admin User',
    role: 'admin',
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', undefined, 405);
  }

  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return sendError(res, 'Email and password are required');
    }

    // Find user by email
    const user = ADMIN_USERS.find(u => u.email === email);

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return sendError(res, 'Invalid email or password', undefined, 401);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set auth cookie
    setAuthCookie(res, token);

    // Return success with user info (excluding password)
    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    return handleApiError(res, error, 'Error during login');
  }
}
