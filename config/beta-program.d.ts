export interface BetaChurchCriteria {
  churchSize: 'small' | 'medium' | 'large' | 'multi-campus';
  technicalAdoption: 'beginner' | 'intermediate' | 'advanced';
  denominationalCategory: string;
  geographicLocation: string;
  currentChallenges: string[];
  commitmentLevel: 'standard' | 'enhanced';
}

export interface BetaSelectionCriteria {
  churchSize: {
    small: {
      min: number;
      max: number;
    };
    medium: {
      min: number;
      max: number;
    };
    large: {
      min: number;
      max: null;
    };
  };
  technicalRequirements: {
    minimumInternetSpeed: string;
    requiredDevices: string[];
    browserSupport: string[];
  };
  commitment: {
    standard: {
      minDurationMonths: number;
      weeklyTimeCommitment: number;
      feedbackFrequency: string;
    };
    enhanced: {
      minDurationMonths: number;
      weeklyTimeCommitment: number;
      feedbackFrequency: string;
    };
  };
  diversity: {
    denominationTypes: string[];
    geographicSpread: {
      urban: number;
      suburban: number;
      rural: number;
    };
  };
}

export interface BetaCohort {
  name: string;
  description: string;
  targetCount: number;
  criteria: {
    churchSize: BetaChurchCriteria['churchSize'] | BetaChurchCriteria['churchSize'][];
    technicalAdoption: BetaChurchCriteria['technicalAdoption'] | BetaChurchCriteria['technicalAdoption'][];
    commitmentLevel: BetaChurchCriteria['commitmentLevel'];
  };
}

export const BETA_SELECTION_CRITERIA: BetaSelectionCriteria;
export const BETA_COHORTS: readonly BetaCohort[]; 