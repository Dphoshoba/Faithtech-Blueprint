const Subscription = require('../models/Subscription');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

const PLAN_CONFIGS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      maxUsers: 1,
      maxTemplates: 3,
      customDomain: false,
      analytics: false,
      prioritySupport: false,
      whiteLabeling: false
    }
  },
  basic: {
    name: 'Basic',
    price: {
      monthly: 29,
      yearly: 290 // 2 months free
    },
    features: {
      maxUsers: 5,
      maxTemplates: 10,
      customDomain: false,
      analytics: true,
      prioritySupport: false,
      whiteLabeling: false
    }
  },
  pro: {
    name: 'Professional',
    price: {
      monthly: 99,
      yearly: 990
    },
    features: {
      maxUsers: 20,
      maxTemplates: 50,
      customDomain: true,
      analytics: true,
      prioritySupport: true,
      whiteLabeling: false
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 'custom',
    features: {
      maxUsers: Infinity,
      maxTemplates: Infinity,
      customDomain: true,
      analytics: true,
      prioritySupport: true,
      whiteLabeling: true
    }
  }
};

class SubscriptionService {
  static async createSubscription(organizationId, plan, interval = 'monthly') {
    try {
      // Check if organization already has a subscription
      const existingSubscription = await Subscription.findOne({ organization: organizationId });
      if (existingSubscription) {
        throw new Error('Organization already has a subscription');
      }

      const planConfig = PLAN_CONFIGS[plan];
      if (!planConfig) {
        throw new Error('Invalid plan selected');
      }

      // Create subscription
      const subscription = new Subscription({
        organization: organizationId,
        plan,
        features: planConfig.features,
        billing: {
          interval,
          currentPeriodStart: new Date(),
          currentPeriodEnd: this.calculatePeriodEnd(new Date(), interval)
        }
      });

      await subscription.save();
      await subscription.updateUsage();

      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async updateSubscription(organizationId, plan, interval) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const planConfig = PLAN_CONFIGS[plan];
      if (!planConfig) {
        throw new Error('Invalid plan selected');
      }

      // If downgrading, check if current usage exceeds new plan limits
      if (planConfig.features.maxUsers < subscription.usage.activeUsers) {
        throw new Error('Cannot downgrade: Active users exceed new plan limits');
      }
      if (planConfig.features.maxTemplates < subscription.usage.activeTemplates) {
        throw new Error('Cannot downgrade: Active templates exceed new plan limits');
      }

      // Update subscription
      subscription.plan = plan;
      subscription.features = planConfig.features;
      subscription.billing.interval = interval;

      await subscription.save();
      return subscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(organizationId, cancelImmediately = false) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (cancelImmediately) {
        subscription.status = 'canceled';
      } else {
        subscription.billing.cancelAtPeriodEnd = true;
      }

      await subscription.save();
      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async getSubscriptionDetails(organizationId) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      await subscription.updateUsage();
      return subscription;
    } catch (error) {
      logger.error('Error getting subscription details:', error);
      throw error;
    }
  }

  static async checkFeatureAccess(organizationId, feature) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription || !subscription.isActive) {
        return false;
      }

      return subscription.hasFeature(feature);
    } catch (error) {
      logger.error('Error checking feature access:', error);
      return false;
    }
  }

  static calculatePeriodEnd(startDate, interval) {
    const endDate = new Date(startDate);
    if (interval === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  static getPlanConfigs() {
    return PLAN_CONFIGS;
  }

  // Stripe integration methods
  static async createStripeCustomer(organizationId, email, paymentMethod) {
    try {
      const customer = await stripe.customers.create({
        email,
        payment_method: paymentMethod,
        invoice_settings: {
          default_payment_method: paymentMethod
        },
        metadata: {
          organizationId
        }
      });

      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  static async createStripeSubscription(customerId, priceId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent']
      });

      return subscription;
    } catch (error) {
      logger.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionService; 