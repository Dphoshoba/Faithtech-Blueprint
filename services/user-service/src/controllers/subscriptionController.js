const SubscriptionService = require('../services/subscriptionService');
const SubscriptionAnalyticsService = require('../services/subscriptionAnalyticsService');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

class SubscriptionController {
  static async getSubscription(req, res) {
    try {
      const { organizationId } = req.params;
      const subscription = await SubscriptionService.getSubscriptionDetails(organizationId);
      res.json(subscription);
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      res.status(404).json({ message: error.message });
    }
  }

  static async getPlans(req, res) {
    try {
      const plans = SubscriptionService.getPlanConfigs();
      res.json(plans);
    } catch (error) {
      logger.error('Error fetching plans:', error);
      res.status(500).json({ message: 'Failed to fetch plans' });
    }
  }

  static async createSubscription(req, res) {
    try {
      validateRequest(req.body, {
        required: ['paymentMethodId', 'planId', 'interval', 'billingDetails'],
        properties: {
          paymentMethodId: { type: 'string' },
          planId: { type: 'string' },
          interval: { type: 'string', enum: ['monthly', 'yearly'] },
          billingDetails: {
            type: 'object',
            required: ['name', 'email', 'address'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              address: {
                type: 'object',
                required: ['line1', 'city', 'state', 'postal_code', 'country'],
                properties: {
                  line1: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  postal_code: { type: 'string' },
                  country: { type: 'string' }
                }
              }
            }
          }
        }
      });

      const { organizationId } = req.user;
      const { paymentMethodId, planId, interval, billingDetails } = req.body;

      // Create Stripe customer if not exists
      let customer = await SubscriptionService.createStripeCustomer(
        organizationId,
        billingDetails.email,
        paymentMethodId
      );

      // Create subscription
      const subscription = await SubscriptionService.createSubscription(
        organizationId,
        planId,
        interval
      );

      // Create Stripe subscription
      const stripeSubscription = await SubscriptionService.createStripeSubscription(
        customer.id,
        subscription.billing.priceId
      );

      // Update subscription with Stripe details
      subscription.billing.customerId = customer.id;
      subscription.billing.subscriptionId = stripeSubscription.id;
      await subscription.save();

      res.json({
        subscription,
        clientSecret: stripeSubscription.latest_invoice.payment_intent?.client_secret
      });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async updateSubscription(req, res) {
    try {
      validateRequest(req.body, {
        required: ['planId', 'interval'],
        properties: {
          planId: { type: 'string' },
          interval: { type: 'string', enum: ['monthly', 'yearly'] }
        }
      });

      const { organizationId } = req.params;
      const { planId, interval } = req.body;

      const subscription = await SubscriptionService.updateSubscription(
        organizationId,
        planId,
        interval
      );

      res.json(subscription);
    } catch (error) {
      logger.error('Error updating subscription:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async cancelSubscription(req, res) {
    try {
      validateRequest(req.body, {
        properties: {
          cancelImmediately: { type: 'boolean' }
        }
      });

      const { organizationId } = req.params;
      const { cancelImmediately = false } = req.body;

      const subscription = await SubscriptionService.cancelSubscription(
        organizationId,
        cancelImmediately
      );

      res.json(subscription);
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async checkFeatureAccess(req, res) {
    try {
      validateRequest(req.params, {
        required: ['organizationId', 'feature'],
        properties: {
          organizationId: { type: 'string' },
          feature: { type: 'string' }
        }
      });

      const { organizationId, feature } = req.params;
      const hasAccess = await SubscriptionService.checkFeatureAccess(organizationId, feature);

      res.json({ hasAccess });
    } catch (error) {
      logger.error('Error checking feature access:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Stripe webhook handler
  static async handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Stripe webhook error:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await SubscriptionService.handleSuccessfulPayment(event.data.object);
          break;
        case 'invoice.payment_failed':
          await SubscriptionService.handleFailedPayment(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await SubscriptionService.handleSubscriptionCanceled(event.data.object);
          break;
        default:
          logger.info(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Error processing webhook' });
    }
  }

  // Analytics endpoints
  static async getMetrics(req, res) {
    try {
      validateRequest(req.query, {
        properties: {
          period: { type: 'string', enum: ['current', 'last_month', 'last_3_months', 'last_6_months', 'last_year'] }
        }
      });

      const { organizationId } = req.params;
      const { period = 'current' } = req.query;

      const metrics = await SubscriptionAnalyticsService.getUsageMetrics(organizationId, period);
      res.json(metrics);
    } catch (error) {
      logger.error('Error getting metrics:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async getTrends(req, res) {
    try {
      validateRequest(req.query, {
        properties: {
          timeframe: { type: 'string', enum: ['daily', 'weekly', 'monthly'] }
        }
      });

      const { organizationId } = req.params;
      const { timeframe = 'monthly' } = req.query;

      const trends = await SubscriptionAnalyticsService.getEngagementTrends(organizationId, timeframe);
      res.json(trends);
    } catch (error) {
      logger.error('Error getting trends:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async getCosts(req, res) {
    try {
      validateRequest(req.query, {
        properties: {
          months: { type: 'number', minimum: 1, maximum: 12 }
        }
      });

      const { organizationId } = req.params;
      const { months = 3 } = req.query;

      const costs = await SubscriptionAnalyticsService.getCostAnalysis(organizationId, months);
      res.json(costs);
    } catch (error) {
      logger.error('Error getting costs:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async getFeatureUsage(req, res) {
    try {
      const { organizationId } = req.params;
      const features = await SubscriptionAnalyticsService.getFeatureUsageReport(organizationId);
      res.json(features);
    } catch (error) {
      logger.error('Error getting feature usage:', error);
      res.status(400).json({ message: error.message });
    }
  }

  static async trackUsage(req, res) {
    try {
      validateRequest(req.body, {
        required: ['type', 'value'],
        properties: {
          type: { type: 'string', enum: ['users', 'templates', 'storage', 'apiCalls'] },
          value: { type: 'number', minimum: 0 },
          metadata: { type: 'object' }
        }
      });

      const { organizationId } = req.params;
      const { type, value, metadata } = req.body;

      const analytics = await SubscriptionAnalyticsService.trackUsage(
        organizationId,
        type,
        value,
        metadata
      );

      res.json(analytics);
    } catch (error) {
      logger.error('Error tracking usage:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = SubscriptionController; 