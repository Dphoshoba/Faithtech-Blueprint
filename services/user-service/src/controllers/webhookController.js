const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Organization = require('../models/Organization');
const logger = require('../utils/logger');
const MeteredBillingService = require('../services/meteredBillingService');

class WebhookController {
  static async handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionCancellation(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await handleSuccessfulPayment(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handleFailedPayment(event.data.object);
          break;

        case 'customer.subscription.trial_will_end':
          await handleTrialEnding(event.data.object);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      logger.error('Error processing webhook:', err);
      res.status(500).send(`Webhook Error: ${err.message}`);
    }
  }
}

async function handleSubscriptionUpdate(stripeSubscription) {
  const subscription = await Subscription.findOne({
    'billing.subscriptionId': stripeSubscription.id
  });

  if (!subscription) {
    logger.error('Subscription not found for update:', stripeSubscription.id);
    return;
  }

  // Update subscription status
  subscription.status = stripeSubscription.status;
  subscription.billing.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  subscription.billing.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;

  // Handle plan changes
  if (stripeSubscription.items.data.length > 0) {
    const mainItem = stripeSubscription.items.data[0];
    const planId = mainItem.price.lookup_key;
    if (planId !== subscription.plan) {
      await handlePlanChange(subscription, planId);
    }
  }

  await subscription.save();
  logger.info('Subscription updated:', subscription._id);
}

async function handleSubscriptionCancellation(stripeSubscription) {
  const subscription = await Subscription.findOne({
    'billing.subscriptionId': stripeSubscription.id
  });

  if (!subscription) {
    logger.error('Subscription not found for cancellation:', stripeSubscription.id);
    return;
  }

  subscription.status = 'canceled';
  subscription.billing.cancelAtPeriodEnd = true;
  await subscription.save();

  // Notify organization about cancellation
  const organization = await Organization.findById(subscription.organization);
  if (organization) {
    // Send cancellation notification
    // TODO: Implement notification service
  }

  logger.info('Subscription cancelled:', subscription._id);
}

async function handleSuccessfulPayment(invoice) {
  const subscription = await Subscription.findOne({
    'billing.customerId': invoice.customer
  });

  if (!subscription) {
    logger.error('Subscription not found for invoice:', invoice.id);
    return;
  }

  // Update payment status
  subscription.status = 'active';
  
  // Record successful payment
  subscription.billing.lastPayment = {
    amount: invoice.amount_paid,
    date: new Date(invoice.created * 1000),
    invoiceId: invoice.id
  };

  await subscription.save();
  logger.info('Payment recorded:', invoice.id);
}

async function handleFailedPayment(invoice) {
  const subscription = await Subscription.findOne({
    'billing.customerId': invoice.customer
  });

  if (!subscription) {
    logger.error('Subscription not found for failed invoice:', invoice.id);
    return;
  }

  subscription.status = 'past_due';
  await subscription.save();

  // Notify organization about payment failure
  const organization = await Organization.findById(subscription.organization);
  if (organization) {
    // Send payment failure notification
    // TODO: Implement notification service
  }

  logger.info('Payment failure recorded:', invoice.id);
}

async function handleTrialEnding(subscription) {
  const sub = await Subscription.findOne({
    'billing.subscriptionId': subscription.id
  });

  if (!sub) {
    logger.error('Subscription not found for trial ending:', subscription.id);
    return;
  }

  // Notify organization about trial ending
  const organization = await Organization.findById(sub.organization);
  if (organization) {
    // Send trial ending notification
    // TODO: Implement notification service
  }

  logger.info('Trial ending notification sent:', sub._id);
}

async function handlePlanChange(subscription, newPlanId) {
  // Update subscription features based on new plan
  const planConfig = require('../config/plans')[newPlanId];
  if (!planConfig) {
    throw new Error(`Invalid plan ID: ${newPlanId}`);
  }

  subscription.plan = newPlanId;
  subscription.features = planConfig.features;
  
  // Reset usage counters if downgrading
  if (planConfig.tier < subscription.tier) {
    subscription.usage = {
      activeUsers: 0,
      activeTemplates: 0,
      storageUsed: 0,
      apiCalls: 0,
      meteredUsage: new Map()
    };
  }

  logger.info('Plan changed:', { from: subscription.plan, to: newPlanId });
}

module.exports = WebhookController; 