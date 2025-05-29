import { RecommendationEngine } from './recommendations/engine';
import { assessmentRules } from './recommendations/rules';
import { Template } from '../models/template.model';
import { Resource } from '../models/resource.model';
import { Assessment } from '../models/assessment.model';
import { Recommendation } from '../models/recommendation.model';
import logger from '../utils/logger';

export class RecommendationService {
  private engine: RecommendationEngine;
  
  constructor() {
    this.engine = new RecommendationEngine(assessmentRules);
  }
  
  // Generate recommendations from assessment results
  async generateRecommendations(assessmentId: string) {
    try {
      // Get assessment results
      const assessment = await Assessment.findById(assessmentId)
        .populate('responses');
        
      if (!assessment) {
        throw new Error('Assessment not found');
      }
      
      // Extract assessment data
      const assessmentData = this.extractAssessmentData(assessment);
      
      // Generate recommendations
      const recommendations = this.engine.generateRecommendations(assessmentData);
      
      // Populate templates and resources
      const enrichedRecommendations = await this.enrichRecommendations(recommendations.recommendations);
      
      // Create recommendation record
      const recommendationRecord = await Recommendation.create({
        assessmentId,
        organizationId: assessment.organizationId,
        userId: assessment.userId,
        recommendations: enrichedRecommendations,
        generatedAt: new Date()
      });
      
      return {
        recommendationId: recommendationRecord._id,
        recommendations: enrichedRecommendations,
        groupedRecommendations: recommendations.groupedRecommendations,
        topRecommendations: recommendations.topRecommendations
      };
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      throw error;
    }
  }
  
  // Extract assessment data into format needed for recommendation engine
  private extractAssessmentData(assessment: any) {
    const data: any = {};
    
    // Process responses
    assessment.responses.forEach((response: any) => {
      // Extract question key and value
      const question = assessment.questions.find((q: any) => q._id.toString() === response.questionId);
      if (question && question.key) {
        // Store response value
        if (question.type === 'scale') {
          data[question.key] = parseInt(response.answer, 10);
        } else if (question.type === 'multiple_choice') {
          data[question.key] = response.answer;
        } else {
          data[question.key] = response.answer;
        }
      }
    });
    
    // Calculate derived metrics
    this.calculateDerivedMetrics(data);
    
    return data;
  }
  
  // Calculate additional metrics from raw data
  private calculateDerivedMetrics(data: any) {
    // Example: Calculate mobile score from multiple metrics
    if (data.mobile_responsive === 'yes' && data.mobile_load_time) {
      data.website_mobile_score = Math.min(100, 
        50 + (data.mobile_responsive === 'yes' ? 30 : 0) - 
        Math.max(0, data.mobile_load_time - 2) * 10
      );
    }
    
    // Calculate online giving percentage
    if (data.total_giving && data.online_giving) {
      data.online_giving_percentage = (data.online_giving / data.total_giving) * 100;
    }
    
    // Calculate content freshness score
    if (data.content_update_frequency) {
      const frequencyScores = {
        daily: 100,
        weekly: 80,
        monthly: 60,
        quarterly: 40,
        yearly: 20
      };
      data.content_freshness_score = frequencyScores[data.content_update_frequency] || 0;
    }
    
    // Calculate volunteer management score
    if (data.volunteer_tracking && data.volunteer_communication) {
      data.volunteer_management_score = 
        (data.volunteer_tracking === 'yes' ? 40 : 0) +
        (data.volunteer_communication === 'yes' ? 30 : 0) +
        (data.volunteer_training === 'yes' ? 30 : 0);
    }
    
    // Add more derived metrics as needed...
  }
  
  // Enrich recommendations with template and resource details
  private async enrichRecommendations(recommendations: any[]) {
    const enriched = [];
    
    // Get all template IDs and resource IDs
    const templateIds = recommendations.flatMap(r => r.templates || []);
    const resourceIds = recommendations.flatMap(r => r.resources || []);
    
    // Fetch templates and resources
    const templates = await Template.find({ templateId: { $in: templateIds } });
    const resources = await Resource.find({ resourceId: { $in: resourceIds } });
    
    // Create maps for quick lookup
    const templateMap = templates.reduce((map: any, t) => {
      map[t.templateId] = t;
      return map;
    }, {});
    
    const resourceMap = resources.reduce((map: any, r) => {
      map[r.resourceId] = r;
      return map;
    }, {});
    
    // Enrich each recommendation
    for (const rec of recommendations) {
      const enrichedRec = { ...rec };
      
      // Add template details
      if (rec.templates && rec.templates.length) {
        enrichedRec.templateDetails = rec.templates
          .map((id: string) => templateMap[id])
          .filter(Boolean);
      }
      
      // Add resource details
      if (rec.resources && rec.resources.length) {
        enrichedRec.resourceDetails = rec.resources
          .map((id: string) => resourceMap[id])
          .filter(Boolean);
      }
      
      enriched.push(enrichedRec);
    }
    
    return enriched;
  }
  
  // Get recommendations by assessment ID
  async getRecommendations(assessmentId: string) {
    try {
      const recommendation = await Recommendation.findOne({ assessmentId })
        .sort({ generatedAt: -1 });
        
      if (!recommendation) {
        throw new Error('No recommendations found for this assessment');
      }
      
      return recommendation;
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      throw error;
    }
  }
  
  // Get recommendations by organization ID
  async getOrganizationRecommendations(organizationId: string) {
    try {
      const recommendations = await Recommendation.find({ organizationId })
        .sort({ generatedAt: -1 })
        .limit(10);
        
      return recommendations;
    } catch (error) {
      logger.error('Error getting organization recommendations:', error);
      throw error;
    }
  }
} 