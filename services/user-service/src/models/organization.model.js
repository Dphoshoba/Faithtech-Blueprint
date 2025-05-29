const mongoose = require('mongoose');

// Define the organization schema
const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['church', 'ministry', 'non-profit', 'business', 'other'],
    default: 'church'
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true,
    match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please enter a valid URL']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  contactPhone: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'standard', 'premium'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'canceled', 'trialing'],
    default: 'active'
  },
  subscriptionExpiry: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  settings: {
    theme: {
      type: String,
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Virtual for full address
organizationSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Method to check if organization has active subscription
organizationSchema.methods.hasActiveSubscription = function() {
  return this.subscriptionStatus === 'active' && this.subscriptionExpiry > new Date();
};

// Method to return organization object without sensitive information
organizationSchema.methods.toJSON = function() {
  const org = this.toObject();
  delete org.__v;
  return org;
};

// Create and export the model
const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization; 