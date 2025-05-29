export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  templates: string[]; // Template IDs
  resources: string[]; // Resource IDs
  condition: (assessmentData: any) => boolean;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  groupedRecommendations: { [key: string]: Recommendation[] };
  topRecommendations: Recommendation[];
}

export interface AssessmentData {
  website_mobile_score?: number;
  visitor_conversion_rate?: number;
  content_freshness_score?: number;
  online_giving_percentage?: number;
  giving_transparency_score?: number;
  has_chms_integration?: boolean;
  volunteer_management_score?: number;
  communication_effectiveness_score?: number;
  social_media_engagement_score?: number;
  [key: string]: any;
} 