import type { NextApiResponse } from 'next';
import { sendSuccess, sendError, handleApiError } from '../../../../utils/api-response';
import { getUserFromRequest } from '../../../../utils/jwt';
import { NextApiRequestWithUser } from '../../../../middleware/auth';

export default async function handler(
  req: NextApiRequestWithUser,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', undefined, 405);
  }

  try {
    // Get user from token
    const user = getUserFromRequest(req);

    if (!user) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    // Check if user is an admin
    if (user.role !== 'admin') {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    // Return user info
    return sendSuccess(
      res,
      {
        user: {
          id: user.id || user.userId,
          email: user.email,
          role: user.role,
          name: 'Admin User', // In a real app, this would come from the database
        },
      },
      'Token validated successfully'
    );
  } catch (error) {
    return handleApiError(res, error, 'Error validating token');
  }
}
