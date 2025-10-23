const SubscriptionPlan = require('../models/SubscriptionPlan');

const subscriptionPlans = [
  {
    planId: 'free',
    name: 'Free Plan',
    description: 'Perfect for getting started with FaithTech Blueprint. Includes essential features for small ministries.',
    tier: 'free',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    billingPeriod: 'lifetime',
    features: [
      { name: 'Basic Assessments', description: 'Access to fundamental ministry assessment tools', included: true },
      { name: 'Community Support', description: 'Get help from our community forums', included: true },
      { name: 'Basic Templates', description: '5 document templates for ministry planning', included: true },
      { name: 'Basic Analytics', description: 'View basic insights into your assessment results', included: true },
      { name: 'Export to PDF', description: 'Download your assessment results as PDF', included: true }
    ],
    limits: {
      assessments: 10,
      templates: 5,
      apiCalls: 1000,
      storage: 1, // 1 GB
      users: 1,
      organizations: 1,
      customBranding: false,
      prioritySupport: false,
      advancedAnalytics: false,
      apiAccess: false,
      whiteLabeling: false,
      customIntegrations: false
    },
    active: true,
    isPublic: true,
    featured: false,
    popular: false,
    trialDays: 0,
    order: 1
  },
  {
    planId: 'basic',
    name: 'Basic Plan',
    description: 'Ideal for growing churches and ministries. More assessments, templates, and storage for expanding needs.',
    tier: 'basic',
    price: {
      monthly: 9.99,
      yearly: 99.99, // ~17% savings
      currency: 'USD'
    },
    billingPeriod: 'monthly',
    features: [
      { name: 'All Free Features', description: 'Everything in the Free plan', included: true },
      { name: 'Advanced Assessments', description: 'Access to 50+ professional assessment tools', included: true },
      { name: 'More Templates', description: '20 customizable templates', included: true },
      { name: 'Email Support', description: 'Get help via email within 48 hours', included: true },
      { name: 'Data Export', description: 'Export your data in multiple formats', included: true },
      { name: 'Team Collaboration', description: 'Invite up to 3 team members', included: true }
    ],
    limits: {
      assessments: 50,
      templates: 20,
      apiCalls: 5000,
      storage: 5, // 5 GB
      users: 3,
      organizations: 1,
      customBranding: false,
      prioritySupport: false,
      advancedAnalytics: true,
      apiAccess: false,
      whiteLabeling: false,
      customIntegrations: false
    },
    active: true,
    isPublic: true,
    featured: false,
    popular: true, // Most popular plan
    trialDays: 14,
    order: 2
  },
  {
    planId: 'premium',
    name: 'Premium Plan',
    description: 'For established organizations needing advanced features, custom branding, and priority support.',
    tier: 'premium',
    price: {
      monthly: 29.99,
      yearly: 299.99, // ~17% savings
      currency: 'USD'
    },
    billingPeriod: 'monthly',
    features: [
      { name: 'All Basic Features', description: 'Everything in the Basic plan', included: true },
      { name: 'Unlimited Assessments', description: 'Create and run unlimited assessments', included: true },
      { name: 'Unlimited Templates', description: 'Access to all templates with customization', included: true },
      { name: 'Priority Support', description: '24/7 priority email and chat support', included: true },
      { name: 'Advanced Analytics', description: 'Detailed insights with custom reports', included: true },
      { name: 'Custom Branding', description: 'Add your logo and colors', included: true },
      { name: 'API Access', description: 'Integrate with your existing systems', included: true },
      { name: 'Advanced Team Features', description: 'Invite up to 10 team members with role-based access', included: true },
      { name: 'Custom Domain', description: 'Use your own domain for assessments', included: true }
    ],
    limits: {
      assessments: -1, // Unlimited
      templates: -1, // Unlimited
      apiCalls: 20000,
      storage: 20, // 20 GB
      users: 10,
      organizations: 3,
      customBranding: true,
      prioritySupport: true,
      advancedAnalytics: true,
      apiAccess: true,
      whiteLabeling: false,
      customIntegrations: false
    },
    active: true,
    isPublic: true,
    featured: true,
    popular: false,
    trialDays: 30,
    order: 3
  },
  {
    planId: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Tailored solutions for large-scale operations. Includes white-labeling, custom integrations, and dedicated support.',
    tier: 'enterprise',
    price: {
      monthly: 99.99,
      yearly: 999.99, // ~17% savings
      currency: 'USD'
    },
    billingPeriod: 'monthly',
    features: [
      { name: 'All Premium Features', description: 'Everything in the Premium plan', included: true },
      { name: 'White-Labeling', description: 'Completely rebrand the platform as your own', included: true },
      { name: 'Custom Integrations', description: 'Custom API integrations with your systems', included: true },
      { name: 'Dedicated Account Manager', description: 'Personal account manager for your success', included: true },
      { name: 'On-Premise Deployment', description: 'Option to deploy on your own infrastructure', included: true },
      { name: 'SLA Guarantee', description: '99.9% uptime guarantee with SLA', included: true },
      { name: 'Advanced Security', description: 'SSO, SAML, advanced security features', included: true },
      { name: 'Unlimited Team Members', description: 'No limits on team size', included: true },
      { name: 'Custom Training', description: 'Personalized training sessions for your team', included: true },
      { name: 'Priority Feature Requests', description: 'Influence product roadmap', included: true }
    ],
    limits: {
      assessments: -1, // Unlimited
      templates: -1, // Unlimited
      apiCalls: -1, // Unlimited
      storage: 100, // 100 GB
      users: -1, // Unlimited
      organizations: -1, // Unlimited
      customBranding: true,
      prioritySupport: true,
      advancedAnalytics: true,
      apiAccess: true,
      whiteLabeling: true,
      customIntegrations: true
    },
    active: true,
    isPublic: true,
    featured: true,
    popular: false,
    trialDays: 30,
    order: 4
  }
];

const seedSubscriptionPlans = async () => {
  try {
    console.log('🌱 Seeding subscription plans...');
    
    // Check if plans already exist
    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans > 0) {
      console.log(`⏭️  ${existingPlans} plans already exist, skipping seed`);
      return;
    }
    
    // Insert all plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log(`✅ Successfully seeded ${createdPlans.length} subscription plans`);
    
    return createdPlans;
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
};

module.exports = {
  subscriptionPlans,
  seedSubscriptionPlans
};

