import Analytics from 'analytics-node';

interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

interface AnalyticsConfig {
  writeKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
}

export class AnalyticsService {
  private client: Analytics;

  constructor(config: AnalyticsConfig) {
    this.client = new Analytics(config.writeKey, {
      host: config.host,
      flushAt: config.flushAt || 20,
      flushInterval: config.flushInterval || 10000,
    });
  }

  async trackEvent(
    eventName: string,
    properties: Record<string, any>,
    userId?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.track({
        event: eventName,
        properties,
        userId: userId || 'anonymous',
        timestamp: new Date(),
      }, (err) => {
        if (err) {
          console.error('Error tracking analytics event:', err);
          reject(new Error('Failed to track analytics event'));
        } else {
          resolve();
        }
      });
    });
  }

  async identifyUser(
    userId: string,
    traits: Record<string, any>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.identify({
        userId,
        traits,
        timestamp: new Date(),
      }, (err) => {
        if (err) {
          console.error('Error identifying user:', err);
          reject(new Error('Failed to identify user'));
        } else {
          resolve();
        }
      });
    });
  }

  async trackFeedbackSubmitted(feedback: {
    featureId: string;
    sentiment: number;
    rating: number;
    tags: string[];
    userId?: string;
  }): Promise<void> {
    const properties = {
      feature_id: feedback.featureId,
      sentiment: feedback.sentiment,
      rating: feedback.rating,
      tags: feedback.tags,
      feedback_type: 'in_app',
    };

    await this.trackEvent('Feedback Submitted', properties, feedback.userId);
  }

  async trackFeedbackViewed(feedbackId: string, userId?: string): Promise<void> {
    const properties = {
      feedback_id: feedbackId,
      view_type: 'detail',
    };

    await this.trackEvent('Feedback Viewed', properties, userId);
  }

  async trackSessionRecordingViewed(
    sessionId: string,
    feedbackId: string,
    userId?: string
  ): Promise<void> {
    const properties = {
      session_id: sessionId,
      feedback_id: feedbackId,
      source: 'feedback_detail',
    };

    await this.trackEvent('Session Recording Viewed', properties, userId);
  }

  async flush(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.flush((err) => {
        if (err) {
          console.error('Error flushing analytics:', err);
          reject(new Error('Failed to flush analytics'));
        } else {
          resolve();
        }
      });
    });
  }
} 