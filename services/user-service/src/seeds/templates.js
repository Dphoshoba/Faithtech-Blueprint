const Template = require('../models/Template');
const User = require('../models/User');

const sampleTemplates = [
  {
    title: 'Church Strategic Plan',
    description: 'Comprehensive 3-year strategic plan for church growth and ministry development',
    category: 'Strategic Planning',
    type: 'document',
    tier: 'premium',
    difficulty: 'advanced',
    contentType: 'markdown',
    content: '# {{churchName}} Strategic Plan\n## {{planYear}}-{{endYear}}\n\n### Mission Statement\n{{missionStatement}}\n\n### Vision Statement\n{{visionStatement}}\n\n### Core Values\n{{coreValues}}\n\n## Strategic Goals\n\n### 1. Spiritual Growth\n**Objective:** {{spiritualGrowthGoal}}\n\n**Action Steps:**\n- {{spiritualAction1}}\n- {{spiritualAction2}}\n- {{spiritualAction3}}\n\n---\n*Prepared by: {{preparedBy}}*\n*Date: {{prepareDate}}*',
    variables: [
      { key: 'churchName', label: 'Church Name', type: 'text', required: true, section: 'basic', order: 1 },
      { key: 'planYear', label: 'Plan Start Year', type: 'number', required: true, section: 'basic', order: 2 },
      { key: 'endYear', label: 'Plan End Year', type: 'number', required: true, section: 'basic', order: 3 },
      { key: 'missionStatement', label: 'Mission Statement', type: 'textarea', required: true, section: 'foundation', order: 1 },
      { key: 'visionStatement', label: 'Vision Statement', type: 'textarea', required: true, section: 'foundation', order: 2 },
      { key: 'coreValues', label: 'Core Values', type: 'textarea', required: true, section: 'foundation', order: 3 },
      { key: 'spiritualGrowthGoal', label: 'Spiritual Growth Objective', type: 'textarea', required: true, section: 'goals', order: 1 },
      { key: 'spiritualAction1', label: 'Spiritual Action 1', type: 'text', required: false, section: 'goals', order: 2 },
      { key: 'spiritualAction2', label: 'Spiritual Action 2', type: 'text', required: false, section: 'goals', order: 3 },
      { key: 'spiritualAction3', label: 'Spiritual Action 3', type: 'text', required: false, section: 'goals', order: 4 },
      { key: 'spiritualMetrics', label: 'Spiritual Success Metrics', type: 'text', required: false, section: 'goals', order: 5 },
      { key: 'preparedBy', label: 'Prepared By', type: 'text', required: true, section: 'metadata', order: 1 },
      { key: 'prepareDate', label: 'Preparation Date', type: 'date', required: true, section: 'metadata', order: 2 }
    ],
    sections: [
      { id: 'basic', title: 'Basic Information', description: 'Church and plan details', order: 1, variables: ['churchName', 'planYear', 'endYear'] },
      { id: 'foundation', title: 'Foundation', description: 'Mission, vision, and values', order: 2, variables: ['missionStatement', 'visionStatement', 'coreValues'] },
      { id: 'goals', title: 'Strategic Goals', description: 'Define your goals and action steps', order: 3, variables: ['spiritualGrowthGoal', 'spiritualAction1', 'spiritualAction2', 'spiritualAction3', 'spiritualMetrics'] },
      { id: 'metadata', title: 'Document Information', description: 'Preparation details', order: 4, variables: ['preparedBy', 'prepareDate'] }
    ],
    tags: ['strategic', 'planning', 'church', 'growth'],
    estimatedTime: 90,
    status: 'published',
    isPublic: true,
    featured: true
  },
  {
    title: 'Youth Ministry Budget',
    description: 'Annual budget planning template for youth ministry programs and events',
    category: 'Budget',
    type: 'document',
    tier: 'basic',
    difficulty: 'intermediate',
    contentType: 'markdown',
    content: '# {{ministryName}} Budget Plan\n' +
'## Fiscal Year {{fiscalYear}}\n\n' +
'### Ministry Overview\n' +
'**Ministry Leader:** {{leaderName}}\n' +
'**Contact:** {{leaderEmail}}\n\n' +
'### Budget Summary\n\n' +
'**Total Budget Request:** ${{totalBudget}}\n\n' +
'## Expense Categories\n\n' +
'### Personnel\n' +
'- Staff Salaries: ${{staffSalaries}}\n' +
'- Volunteer Appreciation: ${{volunteerBudget}}\n' +
'**Subtotal:** ${{personnelTotal}}\n\n' +
'---\n' +
'*Submitted by: {{submittedBy}}*\n' +
'*Date: {{submitDate}}*',
    variables: [
      { key: 'ministryName', label: 'Ministry Name', type: 'text', required: true, defaultValue: 'Youth Ministry' },
      { key: 'fiscalYear', label: 'Fiscal Year', type: 'number', required: true },
      { key: 'leaderName', label: 'Ministry Leader', type: 'text', required: true },
      { key: 'leaderEmail', label: 'Leader Email', type: 'email', required: true },
      { key: 'totalBudget', label: 'Total Budget', type: 'number', required: true },
      { key: 'staffSalaries', label: 'Staff Salaries', type: 'number', required: false },
      { key: 'submittedBy', label: 'Submitted By', type: 'text', required: true },
      { key: 'submitDate', label: 'Submission Date', type: 'date', required: true }
    ],
    sections: [
      { id: 'overview', title: 'Overview', description: 'Ministry and fiscal year information', order: 1, variables: ['ministryName', 'fiscalYear', 'leaderName', 'leaderEmail'] },
      { id: 'budget', title: 'Budget Details', description: 'Enter budget amounts', order: 2, variables: ['totalBudget', 'staffSalaries'] },
      { id: 'submission', title: 'Submission', description: 'Submitter information', order: 3, variables: ['submittedBy', 'submitDate'] }
    ],
    tags: ['budget', 'youth', 'ministry', 'planning'],
    estimatedTime: 45,
    status: 'published',
    isPublic: true,
    featured: true
  },
  {
    title: 'Event Planning Checklist',
    description: 'Complete checklist for planning and executing church events',
    category: 'Event Planning',
    type: 'document',
    tier: 'free',
    difficulty: 'beginner',
    contentType: 'markdown',
    content: '# {{eventName}} - Planning Checklist\n\n## Event Details\n- **Date:** {{eventDate}}\n- **Time:** {{eventTime}}\n- **Location:** {{eventLocation}}\n- **Expected Attendance:** {{expectedAttendance}}\n\n## Pre-Event Checklist\n- Define event purpose and goals\n- Set budget: ${{eventBudget}}\n- Book venue\n\n---\n**Event Coordinator:** {{coordinatorName}}\n**Contact:** {{coordinatorEmail}}',
    variables: [
      { key: 'eventName', label: 'Event Name', type: 'text', required: true },
      { key: 'eventDate', label: 'Event Date', type: 'date', required: true },
      { key: 'eventTime', label: 'Event Time', type: 'text', required: true },
      { key: 'eventLocation', label: 'Location', type: 'text', required: true },
      { key: 'expectedAttendance', label: 'Expected Attendance', type: 'number', required: false },
      { key: 'eventBudget', label: 'Event Budget', type: 'number', required: false },
      { key: 'volunteersNeeded', label: 'Volunteers Needed', type: 'number', required: false },
      { key: 'setupTime', label: 'Setup Time', type: 'text', required: false },
      { key: 'coordinatorName', label: 'Event Coordinator', type: 'text', required: true },
      { key: 'coordinatorEmail', label: 'Coordinator Email', type: 'email', required: true }
    ],
    sections: [
      { id: 'details', title: 'Event Details', description: 'Basic event information', order: 1, variables: ['eventName', 'eventDate', 'eventTime', 'eventLocation'] },
      { id: 'planning', title: 'Planning Info', description: 'Budget and logistics', order: 2, variables: ['expectedAttendance', 'eventBudget', 'volunteersNeeded', 'setupTime'] },
      { id: 'contact', title: 'Contact Information', description: 'Coordinator details', order: 3, variables: ['coordinatorName', 'coordinatorEmail'] }
    ],
    tags: ['event', 'planning', 'checklist', 'coordination'],
    estimatedTime: 20,
    status: 'published',
    isPublic: true,
    featured: false
  }
];

const seedTemplates = async () => {
  try {
    console.log('🌱 Seeding sample templates...');
    
    // Check if templates already exist
    const existingTemplates = await Template.countDocuments();
    if (existingTemplates > 0) {
      console.log(`⏭️  ${existingTemplates} templates already exist, skipping seed`);
      return;
    }
    
    // Find an admin user to be the creator
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found for template seeding, skipping...');
      return;
    }
    
    // Add creator to each template
    const templatesWithCreator = sampleTemplates.map(template => ({
      ...template,
      createdBy: adminUser._id,
      publishedAt: new Date(),
      usageCount: Math.floor(Math.random() * 50) + 10,
      rating: {
        average: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        count: Math.floor(Math.random() * 20) + 5
      }
    }));
    
    // Insert all templates
    const createdTemplates = await Template.insertMany(templatesWithCreator);
    console.log(`✅ Successfully seeded ${createdTemplates.length} sample templates`);
    
    return createdTemplates;
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
};

module.exports = {
  sampleTemplates,
  seedTemplates
};

