import type { NextApiResponse } from 'next';
import { sendSuccess, sendError, handleApiError } from '../../../../utils/api-response';
import connectToDatabase from '../../../../utils/database';
import Lead, { ILead } from '../../../../models/Lead';
import { withAdmin, NextApiRequestWithUser } from '../../../../middleware/auth';
import { FilterQuery } from 'mongoose';

// Apply admin authentication middleware
export default withAdmin(async function handler(
  req: NextApiRequestWithUser,
  res: NextApiResponse
) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getLeads(req, res);
      default:
        return sendError(res, 'Method not allowed', undefined, 405);
    }
  } catch (error) {
    return handleApiError(res, error, 'Error processing leads request');
  }
});

async function getLeads(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Build query
    const query: FilterQuery<ILead> = {};
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status as ILead['status'];
    }
    
    // Search filter
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { churchName: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    
    // Get leads from database
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Lead.countDocuments(query);
    
    // Format leads for response
    const formattedLeads = leads.map(lead => ({
      _id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      churchName: lead.churchName,
      churchSize: lead.churchSize,
      status: lead.status,
      message: lead.message,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      source: lead.source,
      notes: lead.notes,
      tags: lead.tags,
    }));
    
    // Return success response
    return sendSuccess(
      res,
      {
        leads: formattedLeads,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      'Leads retrieved successfully'
    );
  } catch (error) {
    return handleApiError(res, error, 'Error retrieving leads');
  }
}
