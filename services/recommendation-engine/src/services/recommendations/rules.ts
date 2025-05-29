import { Recommendation } from './types';

export const digitalPresenceRules: Recommendation[] = [
  {
    id: 'mobile_optimization',
    title: 'Mobile-First Website Optimization',
    description: 'Improve your website experience for mobile users, who make up over 60% of web traffic.',
    category: 'digital_presence',
    priority: 'high',
    templates: ['website_mobile_optimization'],
    resources: ['mobile_optimization_guide'],
    condition: (data) => {
      return data.website_mobile_score < 70;
    }
  },
  {
    id: 'visitor_journey',
    title: 'First-Time Visitor Journey Enhancement',
    description: 'Optimize your digital experience for first-time visitors to increase engagement.',
    category: 'digital_presence',
    priority: 'medium',
    templates: ['visitor_journey_map', 'website_visitor_paths'],
    resources: ['visitor_experience_guide'],
    condition: (data) => {
      return data.visitor_conversion_rate < 10;
    }
  },
  {
    id: 'content_strategy',
    title: 'Content Strategy Development',
    description: 'Create a cohesive content strategy to engage your audience consistently.',
    category: 'digital_presence',
    priority: 'medium',
    templates: ['content_strategy_template', 'content_calendar'],
    resources: ['church_content_guide'],
    condition: (data) => {
      return data.content_freshness_score < 60;
    }
  }
];

export const givingRules: Recommendation[] = [
  {
    id: 'digital_giving_optimization',
    title: 'Digital Giving Experience Optimization',
    description: 'Streamline your online giving process to increase participation and reduce friction.',
    category: 'giving',
    priority: 'high',
    templates: ['giving_optimization_checklist'],
    resources: ['digital_giving_best_practices'],
    condition: (data) => {
      return data.online_giving_percentage < 40;
    }
  },
  {
    id: 'giving_transparency',
    title: 'Giving Transparency Enhancement',
    description: 'Improve communication about how donations are used to build trust and increase generosity.',
    category: 'giving',
    priority: 'medium',
    templates: ['giving_transparency_framework', 'impact_reporting_template'],
    resources: ['transparency_communication_guide'],
    condition: (data) => {
      return data.giving_transparency_score < 70;
    }
  }
];

export const ministryToolsRules: Recommendation[] = [
  {
    id: 'chms_integration',
    title: 'Church Management System Integration',
    description: 'Connect your church management system to streamline operations and improve data accuracy.',
    category: 'ministry_tools',
    priority: 'high',
    templates: ['chms_integration_guide'],
    resources: ['chms_comparison_guide', 'data_migration_checklist'],
    condition: (data) => {
      return !data.has_chms_integration;
    }
  },
  {
    id: 'volunteer_management',
    title: 'Volunteer Management System Implementation',
    description: 'Implement a dedicated volunteer management system to improve engagement and retention.',
    category: 'ministry_tools',
    priority: 'medium',
    templates: ['volunteer_system_setup', 'volunteer_onboarding'],
    resources: ['volunteer_best_practices'],
    condition: (data) => {
      return data.volunteer_management_score < 60;
    }
  }
];

export const communicationRules: Recommendation[] = [
  {
    id: 'communication_strategy',
    title: 'Multi-Channel Communication Strategy',
    description: 'Develop a comprehensive communication strategy across all digital channels.',
    category: 'communication',
    priority: 'high',
    templates: ['communication_strategy_template', 'channel_planning_guide'],
    resources: ['digital_communication_guide'],
    condition: (data) => {
      return data.communication_effectiveness_score < 70;
    }
  },
  {
    id: 'social_media_engagement',
    title: 'Social Media Engagement Enhancement',
    description: 'Improve your social media presence and engagement with your community.',
    category: 'communication',
    priority: 'medium',
    templates: ['social_media_calendar', 'content_ideas_template'],
    resources: ['social_media_best_practices'],
    condition: (data) => {
      return data.social_media_engagement_score < 60;
    }
  }
];

export const assessmentRules = [
  ...digitalPresenceRules,
  ...givingRules,
  ...ministryToolsRules,
  ...communicationRules
]; 