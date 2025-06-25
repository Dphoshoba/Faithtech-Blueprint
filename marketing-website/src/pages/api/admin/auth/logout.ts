import type { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError } from '../../../../utils/api-response';
import { clearAuthCookie } from '../../../../middleware/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', undefined, 405);
  }

  // Clear the auth cookie
  clearAuthCookie(res);

  // Return success
  return sendSuccess(res, null, 'Logged out successfully');
}
