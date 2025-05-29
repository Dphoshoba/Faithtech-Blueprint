// Beta Church Selection Framework
export interface BetaChurchCriteria {
  churchSize: 'small' | 'medium' | 'large' | 'multi-campus';
  technicalAdoption: 'beginner' | 'intermediate' | 'advanced';
  denominationalCategory: string;
  geographicLocation: string;
  currentChallenges: string[];
  commitmentLevel: 'standard' | 'enhanced';
}

export const BETA_COHORTS = [
  {
    name: 'Small Church Innovators',
    description: 'Small churches (under 200 members) looking to leverage technology with limited resources',
    targetCount: 5,
    criteria: {
      churchSize: 'small',
      technicalAdoption: ['beginner', 'intermediate'],
      commitmentLevel: 'standard'
    }
  },
  {
    name: 'Medium Church Optimizers',
    description: 'Medium-sized churches (200-800 members) seeking to optimize existing tech stack',
    targetCount: 3,
    criteria: {
      churchSize: 'medium',
      technicalAdoption: ['intermediate', 'advanced'],
      commitmentLevel: 'standard'
    }
  },
  {
    name: 'Large Church Integrators',
    description: 'Large churches or multi-campus churches looking for enterprise-level solutions',
    targetCount: 2,
    criteria: {
      churchSize: ['large', 'multi-campus'],
      technicalAdoption: 'advanced',
      commitmentLevel: 'enhanced'
    }
  }
] as const;

// Existing selection criteria with updated size ranges to match cohorts
export const BETA_SELECTION_CRITERIA = {
  churchSize: {
    small: {
      min: 0,
      max: 200
    },
    medium: {
      min: 200,
      max: 800
    },
    large: {
      min: 800,
      max: null
    }
  },
  technicalRequirements: {
    minimumInternetSpeed: '10 Mbps',
    requiredDevices: ['Computer/Laptop', 'Smartphone'],
    browserSupport: ['Chrome', 'Firefox', 'Safari', 'Edge']
  },
  commitment: {
    standard: {
      minDurationMonths: 3,
      weeklyTimeCommitment: 2, // hours
      feedbackFrequency: 'weekly'
    },
    enhanced: {
      minDurationMonths: 6,
      weeklyTimeCommitment: 4, // hours
      feedbackFrequency: 'weekly'
    }
  },
  diversity: {
    denominationTypes: [
      'Protestant',
      'Catholic',
      'Orthodox',
      'Non-denominational'
    ],
    geographicSpread: {
      urban: 0.4,    // 40% urban churches
      suburban: 0.4, // 40% suburban churches
      rural: 0.2     // 20% rural churches
    },
    sizeDistribution: {
      small: 0.3,    // < 200 members
      medium: 0.5,   // 200-1000 members
      large: 0.2     // > 1000 members
    }
  }
};

export const BETA_SUCCESS_METRICS = {
  engagement: {
    weeklyActiveUsers: {
      target: 0.7,  // 70% of congregation
      minimum: 0.5  // 50% of congregation
    },
    featureAdoption: {
      target: 0.8,  // 80% of features used
      minimum: 0.6  // 60% of features used
    },
    sessionDuration: {
      target: 15,   // minutes
      minimum: 8    // minutes
    }
  },
  reliability: {
    uptime: {
      target: 0.995,  // 99.5% uptime
      minimum: 0.99   // 99% uptime
    },
    errorRate: {
      target: 0.001,  // 0.1% error rate
      minimum: 0.005  // 0.5% error rate
    },
    loadTime: {
      target: 2,    // seconds
      minimum: 3    // seconds
    }
  },
  satisfaction: {
    nps: {
      target: 50,   // Net Promoter Score
      minimum: 30
    },
    userSatisfaction: {
      target: 4.5,  // out of 5
      minimum: 4.0
    },
    supportTickets: {
      target: 0.05, // per user per month
      minimum: 0.1
    }
  },
  growth: {
    userGrowth: {
      target: 0.1,  // 10% month over month
      minimum: 0.05
    },
    featureRequests: {
      target: 5,    // per church per month
      minimum: 2
    },
    communityEngagement: {
      target: 0.3,  // 30% of users contributing feedback
      minimum: 0.15
    }
  }
}; 