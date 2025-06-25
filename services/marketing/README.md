# FaithTech Blueprint Marketing Service

A comprehensive marketing automation and analytics platform for FaithTech Blueprint.

## Features

- Content Marketing (Blog, Video, Podcast)
- Email Marketing
- Social Media Management
- Campaign Management
- Marketing Automation
- Analytics and Reporting

## Prerequisites

- Node.js 18+
- PostgreSQL
- API Keys for:
  - OpenAI
  - Twitter
  - Facebook
  - LinkedIn
  - YouTube
  - Medium

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/marketing"

# API Keys
OPENAI_API_KEY=your_openai_api_key
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token
LINKEDIN_USER_ID=your_linkedin_user_id
YOUTUBE_API_KEY=your_youtube_api_key
MEDIUM_API_KEY=your_medium_api_key

# Email
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=your_email_from
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

## Usage

### Content Marketing

```typescript
import { contentMarketing } from './index';

// Create a blog post
const blogPost = await contentMarketing.createBlogPost(
  'Title',
  'Content',
  ['tag1', 'tag2']
);

// Create a video
const video = await contentMarketing.createVideo(
  'Title',
  'Description',
  videoBuffer
);
```

### Email Marketing

```typescript
import { emailMarketing } from './index';

// Send email campaign
const email = await emailMarketing.createEmailCampaign(
  'Subject',
  'Content',
  ['recipient1@example.com'],
  'campaign-id'
);
```

### Social Media

```typescript
import { socialMedia } from './index';

// Post to Twitter
const tweet = await socialMedia.postToTwitter(
  'Content',
  'campaign-id'
);

// Post to Facebook
const fbPost = await socialMedia.postToFacebook(
  'Content',
  'campaign-id'
);

// Post to LinkedIn
const liPost = await socialMedia.postToLinkedIn(
  'Content',
  'campaign-id'
);
```

### Campaign Management

```typescript
import { campaignManagement } from './index';

// Create campaign
const campaign = await campaignManagement.createCampaign({
  name: 'Campaign Name',
  description: 'Description',
  startDate: new Date(),
  budget: 10000,
  channels: ['twitter', 'facebook']
});

// Get campaign performance
const performance = await campaignManagement.getCampaignPerformance('campaign-id');
```

### Marketing Automation

```typescript
import { marketingAutomation } from './index';

// Create workflow
const workflow = await marketingAutomation.createWorkflow({
  name: 'Workflow Name',
  triggers: [
    {
      type: 'campaign_start',
      campaignId: 'campaign-id'
    }
  ],
  actions: [
    {
      type: 'send_email',
      data: {
        subject: 'Subject',
        content: 'Content',
        recipients: ['recipient@example.com']
      }
    }
  ]
});
```

### Analytics

```typescript
import { analytics } from './index';

// Analyze campaign performance
const analysis = await analytics.analyzeCampaignPerformance('campaign-id');

// Segment audience
const segments = await analytics.segmentAudience(audienceData);
```

## Development

1. Start development server:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

3. Lint code:
```bash
npm run lint
```

4. Format code:
```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 