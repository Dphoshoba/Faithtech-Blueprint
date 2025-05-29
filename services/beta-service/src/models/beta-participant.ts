import mongoose, { Document, Schema } from 'mongoose';
import { BetaChurchCriteria } from '../../../../config/beta-program';

interface PrimaryContact {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface OnboardingDetails {
  cohortId: string;
  assessmentDueDate: Date;
  kickoffMeetingDate: Date;
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  startDate: Date;
}

export interface BetaParticipant extends Document, BetaChurchCriteria {
  id: string;
  churchName: string;
  primaryContact: PrimaryContact;
  onboarding?: OnboardingDetails;
  createdAt: Date;
  updatedAt: Date;
}

const betaParticipantSchema = new Schema({
  churchName: {
    type: String,
    required: true,
  },
  churchSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'multi-campus'],
    required: true,
  },
  technicalAdoption: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  denominationalCategory: {
    type: String,
    required: true,
  },
  geographicLocation: {
    type: String,
    required: true,
  },
  currentChallenges: [{
    type: String,
    required: true,
  }],
  commitmentLevel: {
    type: String,
    enum: ['standard', 'enhanced'],
    required: true,
  },
  primaryContact: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  onboarding: {
    cohortId: {
      type: String,
      required: false,
    },
    assessmentDueDate: {
      type: Date,
      required: false,
    },
    kickoffMeetingDate: {
      type: Date,
      required: false,
    },
    onboardingStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      required: false,
    },
  },
}, {
  timestamps: true,
});

// Add indexes
betaParticipantSchema.index({ 'primaryContact.email': 1 }, { unique: true });
betaParticipantSchema.index({ churchSize: 1, technicalAdoption: 1 });
betaParticipantSchema.index({ 'onboarding.cohortId': 1 });
betaParticipantSchema.index({ 'onboarding.onboardingStatus': 1 });

// Add methods
betaParticipantSchema.methods.isOnboardingComplete = function(): boolean {
  return this.onboarding?.onboardingStatus === 'completed';
};

betaParticipantSchema.methods.updateOnboardingStatus = async function(
  status: OnboardingDetails['onboardingStatus']
): Promise<void> {
  this.onboarding = {
    ...this.onboarding,
    onboardingStatus: status,
  };
  await this.save();
};

// Static methods
betaParticipantSchema.statics.findByCohort = function(cohortId: string) {
  return this.find({ 'onboarding.cohortId': cohortId });
};

betaParticipantSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 'primaryContact.email': email });
};

export const BetaParticipant = mongoose.model<BetaParticipant>(
  'BetaParticipant',
  betaParticipantSchema
); 