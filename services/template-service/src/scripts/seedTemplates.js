const mongoose = require('mongoose');
const Template = require('../models/Template');
require('dotenv').config();

const sampleTemplates = [
  {
    name: 'Modern Church Website',
    description: 'A modern, responsive website template for churches with service times, events, and sermon archives.',
    category: 'church',
    type: 'website',
    tags: ['modern', 'responsive', 'church', 'events', 'sermons'],
    components: [
      {
        name: 'Hero Section',
        type: 'header',
        content: {
          html: '<header class="hero">...</header>',
          css: '.hero { ... }',
          js: 'document.addEventListener("DOMContentLoaded", function() { ... });'
        }
      }
    ],
    status: 'published',
    isPublic: true
  },
  {
    name: 'Ministry Newsletter',
    description: 'Professional email newsletter template for ministry updates and announcements.',
    category: 'ministry',
    type: 'email',
    tags: ['newsletter', 'email', 'ministry', 'updates'],
    components: [
      {
        name: 'Newsletter Header',
        type: 'header',
        content: {
          html: '<header class="newsletter-header">...</header>',
          css: '.newsletter-header { ... }',
          js: ''
        }
      }
    ],
    status: 'published',
    isPublic: true
  },
  {
    name: 'Nonprofit Landing Page',
    description: 'High-converting landing page template for nonprofit organizations.',
    category: 'nonprofit',
    type: 'landing-page',
    tags: ['nonprofit', 'donations', 'landing-page', 'conversion'],
    components: [
      {
        name: 'Donation Form',
        type: 'form',
        content: {
          html: '<form class="donation-form">...</form>',
          css: '.donation-form { ... }',
          js: 'const form = document.querySelector(".donation-form"); ...'
        }
      }
    ],
    status: 'published',
    isPublic: true
  }
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing templates
    await Template.deleteMany({});
    console.log('Cleared existing templates');

    // Insert sample templates
    const templates = await Template.insertMany(sampleTemplates);
    console.log(`Inserted ${templates.length} templates`);

    // Add some sample interactions
    for (const template of templates) {
      template.metadata.analytics.views = Math.floor(Math.random() * 1000);
      template.metadata.analytics.downloads = Math.floor(Math.random() * 100);
      template.metadata.analytics.rating.average = 4 + Math.random();
      template.metadata.analytics.rating.count = Math.floor(Math.random() * 50);
      await template.save();
    }
    console.log('Added sample analytics data');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
};

seedTemplates(); 