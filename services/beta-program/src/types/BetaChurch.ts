export interface BetaChurchProfile {
  id: string;
  name: string;
  denomination: string;
  size: ChurchSize;
  location: {
    city: string;
    state: string;
    country: string;
  };
  currentChms: string;
  techStack: string[];
  staffCount: number;
  annualBudget: number;
  website: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  contactPerson: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  applicationStatus: ApplicationStatus;
  applicationDate: Date;
  onboardingStatus: OnboardingStatus;
  feedback: BetaFeedback[];
  metrics: BetaMetrics;
}

export enum ChurchSize {
  SMALL = 'small', // 1-100 members
  MEDIUM = 'medium', // 101-500 members
  LARGE = 'large', // 501-2000 members
  MEGA = 'mega', // 2000+ members
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface BetaFeedback {
  id: string;
  type: FeedbackType;
  category: FeedbackCategory;
  content: string;
  rating: number;
  submittedAt: Date;
  userId: string;
  status: FeedbackStatus;
}

export enum FeedbackType {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  IMPROVEMENT = 'improvement',
  GENERAL = 'general',
}

export enum FeedbackCategory {
  USER_EXPERIENCE = 'user_experience',
  FUNCTIONALITY = 'functionality',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  DOCUMENTATION = 'documentation',
}

export enum FeedbackStatus {
  NEW = 'new',
  IN_REVIEW = 'in_review',
  ADDRESSED = 'addressed',
  CLOSED = 'closed',
}

export interface BetaMetrics {
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  featureUsage: Record<string, number>;
  errorRate: number;
  responseTime: number;
  userSatisfaction: number;
  lastUpdated: Date;
} 