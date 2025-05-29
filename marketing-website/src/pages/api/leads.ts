import type { NextApiRequest, NextApiResponse } from 'next';

type LeadData = {
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const leadData: LeadData = req.body;

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.churchName || !leadData.churchSize) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // TODO: Implement lead storage
    // This could be:
    // 1. Storing in a database
    // 2. Sending to a CRM
    // 3. Sending to an email marketing service
    console.log('Lead data:', leadData);

    // For now, just return success
    return res.status(200).json({ message: 'Lead captured successfully' });
  } catch (error) {
    console.error('Error capturing lead:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 