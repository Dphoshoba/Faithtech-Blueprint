import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message?: string;
  phoneNumber?: string; // Added phoneNumber
  createdAt: Date;
  updatedAt: Date;
  status: 'new' | 'contacted' | 'qualified' | 'disqualified';
  source: 'website' | 'referral' | 'manual' | 'event' | 'other'; // Changed source to enum
  notes?: string[];
  tags?: string[];
}

const LeadSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 'Please enter a valid email'],
    },
    phoneNumber: { // Added phoneNumber schema definition
      type: String,
      trim: true,
      // Add validation if needed, e.g., regex for phone numbers
    },
    churchName: {
      type: String,
      required: [true, 'Church name is required'],
      trim: true,
    },
    churchSize: {
      type: String,
      required: [true, 'Church size is required'],
      enum: ['1-50', '51-200', '201-500', '501+'],
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'disqualified'],
      default: 'new',
    },
    source: { // Updated source to enum
      type: String,
      enum: ['website', 'referral', 'manual', 'event', 'other'],
      default: 'website',
    },
    notes: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create or retrieve the model
export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
