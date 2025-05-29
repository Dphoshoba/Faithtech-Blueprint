const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['header', 'footer', 'navigation', 'content', 'form', 'section'],
    required: true
  },
  content: {
    html: String,
    css: String,
    js: String
  },
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  isCustomizable: {
    type: Boolean,
    default: true
  }
});

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['church', 'ministry', 'nonprofit', 'event', 'landing-page'],
    required: true
  },
  type: {
    type: String,
    enum: ['website', 'email', 'social-media', 'print'],
    required: true
  },
  thumbnail: {
    url: String,
    alt: String
  },
  components: [componentSchema],
  version: {
    major: {
      type: Number,
      default: 1
    },
    minor: {
      type: Number,
      default: 0
    },
    patch: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  metadata: {
    previewUrl: String,
    dependencies: [{
      name: String,
      version: String,
      type: String
    }],
    compatibility: {
      browsers: [String],
      platforms: [String]
    },
    analytics: {
      views: {
        type: Number,
        default: 0
      },
      downloads: {
        type: Number,
        default: 0
      },
      rating: {
        average: {
          type: Number,
          default: 0
        },
        count: {
          type: Number,
          default: 0
        }
      },
      recommendations: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        type: {
          type: String,
          enum: ['collaborative', 'content-based', 'trending'],
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        engaged: {
          type: Boolean,
          default: false
        }
      }]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
templateSchema.index({ name: 1, organization: 1 }, { unique: true });
templateSchema.index({ category: 1, type: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ 'metadata.analytics.rating.average': -1 });

// Version string virtual
templateSchema.virtual('versionString').get(function() {
  return `${this.version.major}.${this.version.minor}.${this.version.patch}`;
});

// Methods
templateSchema.methods.incrementVersion = function(type = 'patch') {
  switch (type) {
    case 'major':
      this.version.major += 1;
      this.version.minor = 0;
      this.version.patch = 0;
      break;
    case 'minor':
      this.version.minor += 1;
      this.version.patch = 0;
      break;
    default:
      this.version.patch += 1;
  }
};

templateSchema.methods.updateAnalytics = async function(action) {
  switch (action) {
    case 'view':
      this.metadata.analytics.views += 1;
      break;
    case 'download':
      this.metadata.analytics.downloads += 1;
      break;
  }
  await this.save();
};

const Template = mongoose.model('Template', templateSchema);

module.exports = Template; 