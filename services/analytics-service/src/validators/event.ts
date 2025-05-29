import { logger } from '../utils/logger';

export class EventValidator {
  public async validateEvent(event: string, properties: Record<string, any>): Promise<void> {
    try {
      // Basic event validation
      if (!event || typeof event !== 'string') {
        throw new Error('Event name is required and must be a string');
      }

      if (event.length > 100) {
        throw new Error('Event name must be less than 100 characters');
      }

      // Validate properties
      if (properties && typeof properties !== 'object') {
        throw new Error('Properties must be an object');
      }

      // Check for reserved property names
      const reservedProperties = ['timestamp', 'userId', 'sessionId', 'event'];
      if (properties) {
        for (const prop of reservedProperties) {
          if (properties.hasOwnProperty(prop)) {
            throw new Error(`Property "${prop}" is reserved and cannot be used`);
          }
        }
      }

      // Validate specific event types
      await this.validateSpecificEvent(event, properties);
    } catch (error) {
      logger.error('Event validation failed:', error);
      throw error;
    }
  }

  private async validateSpecificEvent(event: string, properties: Record<string, any>): Promise<void> {
    switch (event) {
      case 'page_view':
        if (!properties?.page && !properties?.path) {
          throw new Error('Page view events must include a page or path property');
        }
        break;

      case 'user_registered':
        if (!properties?.userId) {
          throw new Error('User registration events must include a userId property');
        }
        break;

      case 'assessment_started':
      case 'assessment_completed':
        if (!properties?.assessmentId) {
          throw new Error('Assessment events must include an assessmentId property');
        }
        break;

      case 'assessment_progress':
        if (!properties?.assessmentId || typeof properties?.progress !== 'number') {
          throw new Error('Assessment progress events must include assessmentId and progress (number) properties');
        }
        if (properties.progress < 0 || properties.progress > 100) {
          throw new Error('Assessment progress must be between 0 and 100');
        }
        break;

      case 'template_downloaded':
      case 'template_customized':
      case 'template_completed':
        if (!properties?.templateId) {
          throw new Error('Template events must include a templateId property');
        }
        break;

      case 'subscription_started':
      case 'subscription_completed':
      case 'subscription_upgraded':
        if (!properties?.planId) {
          throw new Error('Subscription events must include a planId property');
        }
        break;

      case 'feature_used':
        if (!properties?.feature_id) {
          throw new Error('Feature usage events must include a feature_id property');
        }
        break;

      case 'feature_feedback':
        if (!properties?.feature_id || typeof properties?.rating !== 'number') {
          throw new Error('Feature feedback events must include feature_id and rating (number) properties');
        }
        if (properties.rating < 1 || properties.rating > 5) {
          throw new Error('Feature feedback rating must be between 1 and 5');
        }
        break;

      case 'error':
        if (!properties?.error_type) {
          throw new Error('Error events must include an error_type property');
        }
        break;

      case 'performance_metric':
        if (!properties?.metric_type || typeof properties?.value !== 'number') {
          throw new Error('Performance metric events must include metric_type and value (number) properties');
        }
        break;

      case 'api_request':
        if (!properties?.endpoint) {
          throw new Error('API request events must include an endpoint property');
        }
        break;

      default:
        // Allow custom events without specific validation
        break;
    }
  }

  public validateTimeRange(timeRange: string): boolean {
    const validRanges = ['7d', '30d', '90d'];
    return validRanges.includes(timeRange);
  }

  public validateFunnelName(funnelName: string): boolean {
    const validFunnels = [
      'User Acquisition',
      'Assessment Completion',
      'Template Utilization',
      'Subscription Conversion'
    ];
    return validFunnels.includes(funnelName);
  }

  public validateCohortType(cohortType: string): boolean {
    const validTypes = ['daily', 'weekly', 'monthly', 'source'];
    return validTypes.includes(cohortType);
  }
}
