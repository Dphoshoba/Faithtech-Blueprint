import type { NextApiResponse } from 'next';
import { sendSuccess, sendError, handleApiError } from '../../../../utils/api-response';
import connectToDatabase from '../../../../utils/database';
import Lead, { ILead } from '../../../../models/Lead'; // Import ILead
import { withAdmin, NextApiRequestWithUser } from '../../../../middleware/auth';

// Apply admin authentication middleware
export default withAdmin(async function handler(
  req: NextApiRequestWithUser,
  res: NextApiResponse
) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get lead ID from request
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return sendError(res, 'Invalid lead ID', undefined, 400);
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return await getLead(req, res, id);
      case 'PATCH':
        return await updateLead(req, res, id);
      case 'DELETE':
        return await deleteLead(req, res, id);
      default:
        return sendError(res, 'Method not allowed', undefined, 405);
    }
  } catch (error) {
    return handleApiError(res, error, 'Error processing lead request');
  }
});

async function getLead(req: NextApiRequestWithUser, res: NextApiResponse, id: string) {
  try {
    // Find lead by ID
    const lead: ILead | null = await Lead.findById(id);
    
    if (!lead) {
      return sendError(res, 'Lead not found', undefined, 404);
    }
    
    // Return success response
    return sendSuccess(
      res,
      {
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
      },
      'Lead retrieved successfully'
    );
  } catch (error) {
    return handleApiError(res, error, 'Error retrieving lead');
  }
}

async function updateLead(req: NextApiRequestWithUser, res: NextApiResponse, id: string) {
  try {
    // Get update data from request body
    const updateData = req.body;
    
    // Validate update data
    if (!updateData || Object.keys(updateData).length === 0) {
      return sendError(res, 'No update data provided', undefined, 400);
    }
    
    // Only allow specific fields to be updated
    const allowedFields = ['status', 'notes', 'tags'];
    const filteredData: Record<string, ILead['status'] | ILead['notes'] | ILead['tags']> = {};
    
    for (const field of allowedFields) {
      if (field in updateData) {
        filteredData[field] = updateData[field];
      }
    }
    
    // If updating status, validate it
    if ('status' in filteredData) {
      const validStatuses = ['new', 'contacted', 'qualified', 'disqualified'];
      if (!validStatuses.includes(filteredData.status)) {
        return sendError(res, 'Invalid status value', undefined, 400);
      }
    }
    
    // If adding notes, handle it specially
    if ('notes' in updateData && Array.isArray(updateData.notes)) {
      // Find the lead first to get existing notes
      const lead = await Lead.findById(id);
      if (!lead) {
        return sendError(res, 'Lead not found', undefined, 404);
      }
      
      // Combine existing notes with new ones
      filteredData.notes = [...(lead.notes || []), ...updateData.notes];
    }
    
    // Update lead in database
    const updatedLead: ILead | null = await Lead.findByIdAndUpdate(
      id,
      { $set: filteredData },
      { new: true, runValidators: true }
    );
    
    if (!updatedLead) {
      return sendError(res, 'Lead not found', undefined, 404);
    }
    
    // Return success response
    return sendSuccess(
      res,
      {
        _id: updatedLead._id.toString(),
        name: updatedLead.name,
        email: updatedLead.email,
        churchName: updatedLead.churchName,
        churchSize: updatedLead.churchSize,
        status: updatedLead.status,
        message: updatedLead.message,
        createdAt: updatedLead.createdAt,
        updatedAt: updatedLead.updatedAt,
        source: updatedLead.source,
        notes: updatedLead.notes,
        tags: updatedLead.tags,
      },
      'Lead updated successfully'
    );
  } catch (error) {
    return handleApiError(res, error, 'Error updating lead');
  }
}

async function deleteLead(req: NextApiRequestWithUser, res: NextApiResponse, id: string) {
  try {
    // Delete lead from database
    const deletedLead = await Lead.findByIdAndDelete(id);
    
    if (!deletedLead) {
      return sendError(res, 'Lead not found', undefined, 404);
    }
    
    // Return success response
    return sendSuccess(
      res,
      { _id: id },
      'Lead deleted successfully'
    );
  } catch (error) {
    return handleApiError(res, error, 'Error deleting lead');
  }
}
