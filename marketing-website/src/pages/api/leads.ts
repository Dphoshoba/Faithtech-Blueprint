import type { NextApiRequest, NextApiResponse } from 'next';
import { sendSuccess, sendError, handleApiError } from '../../utils/api-response';
import connectToDatabase from '../../utils/database';
import Lead from '../../models/Lead';

interface LeadData {
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message?: string;
  phoneNumber?: string; // Added
  source?: 'website' | 'referral' | 'manual' | 'event' | 'other'; // Added
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', undefined, 405);
  }

  try {
    const leadData = req.body as LeadData;

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.churchName || !leadData.churchSize) {
      return sendError(res, 'Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(leadData.email)) {
      return sendError(res, 'Invalid email format');
    }

    // Connect to database
    await connectToDatabase();
    
    // Check if lead with this email already exists
    const existingLead = await Lead.findOne({ email: leadData.email });
    if (existingLead) {
      return sendError(res, 'A lead with this email already exists', undefined, 409);
    }
    
    // Create new lead in database
    const lead = new Lead({
      name: leadData.name,
      email: leadData.email,
      churchName: leadData.churchName,
      churchSize: leadData.churchSize,
      message: leadData.message,
      phoneNumber: leadData.phoneNumber, // Added
      source: leadData.source, // Added (schema will default if undefined)
    });
    
    await lead.save();
    console.log('Lead saved to database:', lead._id);

    // Send notification email
    // This would typically use a service like SendGrid or AWS SES
    await sendNotificationEmail(leadData);

    // Return success
    return sendSuccess(res, { email: leadData.email }, 'Lead captured successfully');
  } catch (error) {
    return handleApiError(res, error, 'Error processing lead submission');
  }
}

async function sendNotificationEmail(leadData: LeadData) {
  // This is a placeholder for actual email sending logic
  // In a real implementation, you would use a service like SendGrid, Mailchimp, etc.
  
  console.log('Sending notification email for lead:', leadData.email);
  
  // Example email content
  const emailContent = `
    New Lead Submission:
    
    Name: ${leadData.name}
    Email: ${leadData.email}
    Phone Number: ${leadData.phoneNumber || 'N/A'}
    Church Name: ${leadData.churchName}
    Church Size: ${leadData.churchSize}
    Source: ${leadData.source || 'N/A'}
    Message: ${leadData.message || 'N/A'}
  `;
  
  console.log('Email content:', emailContent);
  
  // In a real implementation, you would call your email service here
  // Example with SendGrid:
  // await sendgrid.send({
  //   to: 'your-team@example.com',
  //   from: 'no-reply@your-domain.com',
  //   subject: 'New Lead Submission',
  //   text: emailContent,
  // });
  
  return true;
}
