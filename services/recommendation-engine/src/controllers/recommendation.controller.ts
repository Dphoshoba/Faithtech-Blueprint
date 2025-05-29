import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import logger from '../utils/logger';

export class RecommendationController {
  private service: RecommendationService;

  constructor() {
    this.service = new RecommendationService();
  }

  // Generate recommendations for an assessment
  async generateRecommendations(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;

      if (!assessmentId) {
        return res.status(400).json({
          error: 'Assessment ID is required'
        });
      }

      const recommendations = await this.service.generateRecommendations(assessmentId);

      res.json(recommendations);
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      res.status(500).json({
        error: 'Failed to generate recommendations'
      });
    }
  }

  // Get recommendations for an assessment
  async getRecommendations(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;

      if (!assessmentId) {
        return res.status(400).json({
          error: 'Assessment ID is required'
        });
      }

      const recommendations = await this.service.getRecommendations(assessmentId);

      res.json(recommendations);
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      res.status(500).json({
        error: 'Failed to get recommendations'
      });
    }
  }

  // Get recommendations for an organization
  async getOrganizationRecommendations(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        return res.status(400).json({
          error: 'Organization ID is required'
        });
      }

      const recommendations = await this.service.getOrganizationRecommendations(organizationId);

      res.json(recommendations);
    } catch (error) {
      logger.error('Error getting organization recommendations:', error);
      res.status(500).json({
        error: 'Failed to get organization recommendations'
      });
    }
  }

  // Update implementation status
  async updateImplementationStatus(req: Request, res: Response) {
    try {
      const { recommendationId } = req.params;
      const { status, progress, notes } = req.body;

      if (!recommendationId) {
        return res.status(400).json({
          error: 'Recommendation ID is required'
        });
      }

      if (!status || typeof progress !== 'number') {
        return res.status(400).json({
          error: 'Status and progress are required'
        });
      }

      const recommendation = await this.service.updateImplementationStatus(
        recommendationId,
        status,
        progress,
        notes
      );

      res.json(recommendation);
    } catch (error) {
      logger.error('Error updating implementation status:', error);
      res.status(500).json({
        error: 'Failed to update implementation status'
      });
    }
  }

  // Add feedback to recommendation
  async addFeedback(req: Request, res: Response) {
    try {
      const { recommendationId } = req.params;
      const { helpful, comments } = req.body;

      if (!recommendationId) {
        return res.status(400).json({
          error: 'Recommendation ID is required'
        });
      }

      if (typeof helpful !== 'boolean') {
        return res.status(400).json({
          error: 'Helpful feedback is required'
        });
      }

      const recommendation = await this.service.addFeedback(
        recommendationId,
        helpful,
        comments
      );

      res.json(recommendation);
    } catch (error) {
      logger.error('Error adding feedback:', error);
      res.status(500).json({
        error: 'Failed to add feedback'
      });
    }
  }

  // Get implementation status for organization
  async getImplementationStatus(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        return res.status(400).json({
          error: 'Organization ID is required'
        });
      }

      const status = await this.service.getImplementationStatus(organizationId);

      res.json(status);
    } catch (error) {
      logger.error('Error getting implementation status:', error);
      res.status(500).json({
        error: 'Failed to get implementation status'
      });
    }
  }
} 