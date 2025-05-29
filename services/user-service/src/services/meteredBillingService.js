const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

class MeteredBillingService {
  /**
   * Record usage for a metered feature
   * @param {string} organizationId - The organization ID
   * @param {string} featureId - The feature identifier
   * @param {number} quantity - The quantity to record
   * @param {Object} options - Additional options
   */
  static async recordUsage(organizationId, featureId, quantity, options = {}) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const meteredUsage = subscription.usage.meteredUsage.get(featureId) || {
        current: 0,
        lastSync: new Date(),
        billingMode: 'metered',
        tiers: []
      };

      // Update local usage tracking
      meteredUsage.current += quantity;
      meteredUsage.lastSync = new Date();
      subscription.usage.meteredUsage.set(featureId, meteredUsage);
      await subscription.save();

      // If Stripe subscription exists, report usage
      if (subscription.billing?.subscriptionId) {
        await this.reportUsageToStripe(
          subscription.billing.subscriptionId,
          featureId,
          quantity,
          options
        );
      }

      return meteredUsage;
    } catch (error) {
      logger.error('Error recording metered usage:', error);
      throw error;
    }
  }

  /**
   * Report usage to Stripe
   * @private
   */
  static async reportUsageToStripe(subscriptionId, featureId, quantity, options = {}) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const item = subscription.items.data.find(
        item => item.price.lookup_key === featureId
      );

      if (!item) {
        throw new Error(`No subscription item found for feature: ${featureId}`);
      }

      await stripe.subscriptionItems.createUsageRecord(
        item.id,
        {
          quantity,
          timestamp: Math.floor(Date.now() / 1000),
          action: options.action || 'increment'
        }
      );
    } catch (error) {
      logger.error('Error reporting usage to Stripe:', error);
      throw error;
    }
  }

  /**
   * Calculate billing for metered usage
   * @param {string} organizationId - The organization ID
   * @param {string} featureId - The feature identifier
   * @returns {Object} Billing calculation results
   */
  static async calculateBilling(organizationId, featureId) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const meteredUsage = subscription.usage.meteredUsage.get(featureId);
      if (!meteredUsage) {
        return { amount: 0, currency: 'usd' };
      }

      let amount = 0;
      const { current: usage, tiers, billingMode } = meteredUsage;

      if (billingMode === 'metered') {
        // Simple per-unit pricing
        const tier = tiers[0];
        amount = usage * (tier?.unitPrice || 0);
      } else if (billingMode === 'graduated') {
        // Graduated pricing tiers
        let remainingUsage = usage;
        for (const tier of tiers) {
          const tierUsage = Math.min(remainingUsage, tier.upTo);
          amount += tierUsage * tier.unitPrice + (tier.flatFee || 0);
          remainingUsage -= tierUsage;
          if (remainingUsage <= 0) break;
        }
      }

      return {
        amount,
        currency: 'usd',
        usage,
        billingMode,
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating metered billing:', error);
      throw error;
    }
  }

  /**
   * Configure metered billing for a feature
   * @param {string} organizationId - The organization ID
   * @param {string} featureId - The feature identifier
   * @param {Object} config - Billing configuration
   */
  static async configureBilling(organizationId, featureId, config) {
    try {
      const subscription = await Subscription.findOne({ organization: organizationId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const meteredUsage = subscription.usage.meteredUsage.get(featureId) || {
        current: 0,
        lastSync: new Date(),
        billingMode: config.billingMode || 'metered',
        tiers: []
      };

      meteredUsage.billingMode = config.billingMode;
      meteredUsage.tiers = config.tiers;

      subscription.usage.meteredUsage.set(featureId, meteredUsage);
      await subscription.save();

      return meteredUsage;
    } catch (error) {
      logger.error('Error configuring metered billing:', error);
      throw error;
    }
  }
}

module.exports = MeteredBillingService; 