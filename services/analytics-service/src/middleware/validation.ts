import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

const eventSchema = Joi.object({
  event: Joi.string().required().min(1).max(255),
  properties: Joi.object().default({}),
  userId: Joi.string().allow(null),
  timestamp: Joi.date().default(Date.now),
});

const userSchema = Joi.object({
  userId: Joi.string().required(),
  traits: Joi.object().required(),
});

const pageViewSchema = Joi.object({
  page: Joi.string().required(),
  properties: Joi.object().default({}),
  userId: Joi.string().allow(null),
  timestamp: Joi.date().default(Date.now),
});

export const validateEventSchema = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await eventSchema.validateAsync(req.body);
    next();
  } catch (error) {
    logger.error('Event validation error:', error);
    res.status(400).json({
      error: 'Invalid event data',
      details: error.details?.map((d: any) => d.message),
    });
  }
};

export const validateUserSchema = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await userSchema.validateAsync(req.body);
    next();
  } catch (error) {
    logger.error('User validation error:', error);
    res.status(400).json({
      error: 'Invalid user data',
      details: error.details?.map((d: any) => d.message),
    });
  }
};

export const validatePageViewSchema = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await pageViewSchema.validateAsync(req.body);
    next();
  } catch (error) {
    logger.error('Page view validation error:', error);
    res.status(400).json({
      error: 'Invalid page view data',
      details: error.details?.map((d: any) => d.message),
    });
  }
};

export const validateTimeRange = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timeRange = req.query.timeRange as string;
  const validRanges = ['7d', '30d', '90d'];

  if (!timeRange || !validRanges.includes(timeRange)) {
    res.status(400).json({
      error: 'Invalid time range',
      message: 'Time range must be one of: 7d, 30d, 90d',
    });
    return;
  }

  next();
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1 || limit < 1 || limit > 100) {
    res.status(400).json({
      error: 'Invalid pagination parameters',
      message: 'Page must be >= 1 and limit must be between 1 and 100',
    });
    return;
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();
  next();
};

export const validateDateRange = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startDate = new Date(req.query.startDate as string);
  const endDate = new Date(req.query.endDate as string);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    res.status(400).json({
      error: 'Invalid date range',
      message: 'Start date and end date must be valid dates',
    });
    return;
  }

  if (startDate > endDate) {
    res.status(400).json({
      error: 'Invalid date range',
      message: 'Start date must be before end date',
    });
    return;
  }

  const maxRange = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
  if (endDate.getTime() - startDate.getTime() > maxRange) {
    res.status(400).json({
      error: 'Invalid date range',
      message: 'Date range cannot exceed 90 days',
    });
    return;
  }

  next();
};

export const validateMetricType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const metricType = req.query.metricType as string;
  const validMetrics = [
    'active_users',
    'conversion_rates',
    'engagement',
    'retention',
    'feature_usage',
    'performance',
    'errors',
  ];

  if (!metricType || !validMetrics.includes(metricType)) {
    res.status(400).json({
      error: 'Invalid metric type',
      message: `Metric type must be one of: ${validMetrics.join(', ')}`,
    });
    return;
  }

  next();
};

export const validateEventType = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const eventType = req.query.eventType as string;
  const validEvents = [
    'page_view',
    'feature_used',
    'error',
    'performance_metric',
    'user_feedback',
    'api_request',
  ];

  if (!eventType || !validEvents.includes(eventType)) {
    res.status(400).json({
      error: 'Invalid event type',
      message: `Event type must be one of: ${validEvents.join(', ')}`,
    });
    return;
  }

  next();
}; 