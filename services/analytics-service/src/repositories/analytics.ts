import { Pool } from 'pg';
import { logger } from '../utils/logger';

interface EventData {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

interface UserProfile {
  userId: string;
  traits: Record<string, any>;
  updatedAt: Date;
}

interface PageView {
  page: string;
  properties: Record<string, any>;
  userId?: string;
  timestamp: Date;
}

export class AnalyticsRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.NODE_ENV === 'production',
    });
  }

  // Event Storage Methods
  public async saveEvent(
    event: string,
    properties: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const query = `
      INSERT INTO analytics_events (event_name, properties, user_id, timestamp)
      VALUES ($1, $2, $3, $4)
    `;

    try {
      await this.pool.query(query, [
        event,
        properties,
        userId,
        new Date(),
      ]);
    } catch (error) {
      logger.error('Error saving event:', error);
      throw new Error('Failed to save event');
    }
  }

  public async updateUserProfile(
    userId: string,
    traits: Record<string, any>
  ): Promise<void> {
    const query = `
      INSERT INTO user_profiles (user_id, traits, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET traits = $2, updated_at = $3
    `;

    try {
      await this.pool.query(query, [userId, traits, new Date()]);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  public async savePageView(
    page: string,
    properties: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const query = `
      INSERT INTO page_views (page_path, properties, user_id, timestamp)
      VALUES ($1, $2, $3, $4)
    `;

    try {
      await this.pool.query(query, [
        page,
        properties,
        userId,
        new Date(),
      ]);
    } catch (error) {
      logger.error('Error saving page view:', error);
      throw new Error('Failed to save page view');
    }
  }

  // Analytics Query Methods
  public async getEventsByTimeRange(
    startDate: Date,
    endDate: Date,
    eventType?: string
  ): Promise<EventData[]> {
    const query = `
      SELECT event_name, properties, user_id, timestamp
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
      ${eventType ? 'AND event_name = $3' : ''}
      ORDER BY timestamp DESC
    `;

    try {
      const params = eventType ? [startDate, endDate, eventType] : [startDate, endDate];
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  public async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    const query = `
      SELECT user_id, traits, updated_at
      FROM user_profiles
      WHERE user_id = ANY($1)
    `;

    try {
      const result = await this.pool.query(query, [userIds]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user profiles:', error);
      throw new Error('Failed to fetch user profiles');
    }
  }

  public async getPageViews(
    startDate: Date,
    endDate: Date,
    page?: string
  ): Promise<PageView[]> {
    const query = `
      SELECT page_path, properties, user_id, timestamp
      FROM page_views
      WHERE timestamp BETWEEN $1 AND $2
      ${page ? 'AND page_path = $3' : ''}
      ORDER BY timestamp DESC
    `;

    try {
      const params = page ? [startDate, endDate, page] : [startDate, endDate];
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching page views:', error);
      throw new Error('Failed to fetch page views');
    }
  }

  public async getUniqueUsers(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT user_id) as unique_users
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
      AND user_id IS NOT NULL
    `;

    try {
      const result = await this.pool.query(query, [startDate, endDate]);
      return parseInt(result.rows[0].unique_users);
    } catch (error) {
      logger.error('Error counting unique users:', error);
      throw new Error('Failed to count unique users');
    }
  }

  public async getEventCounts(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const query = `
      SELECT event_name, COUNT(*) as count
      FROM analytics_events
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY event_name
    `;

    try {
      const result = await this.pool.query(query, [startDate, endDate]);
      return result.rows.reduce((acc, row) => {
        acc[row.event_name] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Error counting events:', error);
      throw new Error('Failed to count events');
    }
  }

  public async getUserSessions(
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const query = `
      WITH sessions AS (
        SELECT
          user_id,
          timestamp,
          EXTRACT(EPOCH FROM (
            timestamp - LAG(timestamp) OVER (
              PARTITION BY user_id
              ORDER BY timestamp
            )
          )) / 60 as time_diff
        FROM analytics_events
        WHERE timestamp BETWEEN $1 AND $2
        AND user_id IS NOT NULL
        ORDER BY user_id, timestamp
      )
      SELECT
        user_id,
        COUNT(*) as session_count,
        AVG(CASE WHEN time_diff <= 30 THEN time_diff END) as avg_session_duration
      FROM sessions
      GROUP BY user_id
    `;

    try {
      const result = await this.pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error analyzing user sessions:', error);
      throw new Error('Failed to analyze user sessions');
    }
  }

  // Database Management
  public async createTables(): Promise<void> {
    const queries = [
      `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        properties JSONB,
        user_id VARCHAR(255),
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id VARCHAR(255) PRIMARY KEY,
        traits JSONB,
        updated_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        page_path VARCHAR(255) NOT NULL,
        properties JSONB,
        user_id VARCHAR(255),
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      `,
    ];

    try {
      for (const query of queries) {
        await this.pool.query(query);
      }
      logger.info('Analytics tables created successfully');
    } catch (error) {
      logger.error('Error creating analytics tables:', error);
      throw new Error('Failed to create analytics tables');
    }
  }

  public async cleanup(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
    }
  }
} 