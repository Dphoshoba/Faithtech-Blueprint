const Assessment = require('../models/Assessment');
const User = require('../models/User');

const sampleAssessments = [
  {
    title: 'Church Health Assessment',
    description: 'Evaluate the overall health of your church including worship, community, and outreach',
    category: 'Church Health',
    tier: 'free',
    difficulty: 'intermediate',
    timeLimit: 30,
    status: 'published',
    tags: ['church', 'health', 'community', 'worship'],
    questions: [
      {
        id: 'q1',
        text: 'How would you rate your church attendance growth over the past year?',
        type: 'scale',
        required: true,
        scaleRange: {
          min: 1,
          max: 10,
          step: 1,
          labels: {
            min: 'Significant Decline',
            max: 'Significant Growth'
          }
        }
      },
      {
        id: 'q2',
        text: 'What is your church\'s primary mission statement?',
        type: 'text',
        required: true,
        maxLength: 500,
        minLength: 10
      },
      {
        id: 'q3',
        text: 'How would you describe your church\'s community engagement?',
        type: 'multiple-choice',
        required: true,
        options: [
          { id: 'opt1', text: 'Very active in community outreach', value: 5 },
          { id: 'opt2', text: 'Moderately engaged', value: 3 },
          { id: 'opt3', text: 'Limited community involvement', value: 1 }
        ]
      },
      {
        id: 'q4',
        text: 'Does your church have a clear discipleship pathway?',
        type: 'boolean',
        required: true
      },
      {
        id: 'q5',
        text: 'Rate the quality of your worship services',
        type: 'rating',
        required: true,
        scaleRange: { min: 1, max: 5, step: 1 }
      }
    ],
    scoring: {
      method: 'automatic',
      maxScore: 100,
      passingScore: 70,
      weightedQuestions: false
    },
    isPublic: true
  },
  {
    title: 'Leadership Evaluation',
    description: 'Comprehensive assessment of leadership effectiveness and team dynamics',
    category: 'Leadership',
    tier: 'premium',
    difficulty: 'advanced',
    timeLimit: 45,
    status: 'published',
    tags: ['leadership', 'management', 'team', 'effectiveness'],
    questions: [
      {
        id: 'q1',
        text: 'How clearly are roles and responsibilities defined in your leadership team?',
        type: 'scale',
        required: true,
        scaleRange: {
          min: 1,
          max: 10,
          step: 1,
          labels: {
            min: 'Very Unclear',
            max: 'Extremely Clear'
          }
        }
      },
      {
        id: 'q2',
        text: 'Describe your leadership team\'s communication style',
        type: 'multiple-choice',
        required: true,
        options: [
          { id: 'opt1', text: 'Open and transparent', value: 5 },
          { id: 'opt2', text: 'Moderately open', value: 3 },
          { id: 'opt3', text: 'Top-down directive', value: 2 },
          { id: 'opt4', text: 'Unclear or inconsistent', value: 1 }
        ]
      },
      {
        id: 'q3',
        text: 'What are the biggest challenges facing your leadership team?',
        type: 'text',
        required: true,
        maxLength: 1000,
        minLength: 20
      },
      {
        id: 'q4',
        text: 'How often does your leadership team meet for strategic planning?',
        type: 'multiple-choice',
        required: true,
        options: [
          { id: 'opt1', text: 'Weekly', value: 5 },
          { id: 'opt2', text: 'Bi-weekly', value: 4 },
          { id: 'opt3', text: 'Monthly', value: 3 },
          { id: 'opt4', text: 'Quarterly', value: 2 },
          { id: 'opt5', text: 'Rarely or never', value: 1 }
        ]
      }
    ],
    scoring: {
      method: 'automatic',
      maxScore: 100,
      passingScore: 75,
      weightedQuestions: true
    },
    isPublic: true
  },
  {
    title: 'Youth Ministry Assessment',
    description: 'Evaluate the effectiveness and engagement of your youth ministry programs',
    category: 'Youth Ministry',
    tier: 'basic',
    difficulty: 'beginner',
    timeLimit: 25,
    status: 'published',
    tags: ['youth', 'ministry', 'engagement', 'programs'],
    questions: [
      {
        id: 'q1',
        text: 'How many active youth participants do you have?',
        type: 'scale',
        required: true,
        scaleRange: {
          min: 0,
          max: 200,
          step: 10,
          labels: {
            min: '0',
            max: '200+'
          }
        }
      },
      {
        id: 'q2',
        text: 'What is the primary focus of your youth ministry?',
        type: 'multiple-choice',
        required: true,
        options: [
          { id: 'opt1', text: 'Spiritual growth and discipleship', value: 5 },
          { id: 'opt2', text: 'Community building', value: 4 },
          { id: 'opt3', text: 'Outreach and evangelism', value: 4 },
          { id: 'opt4', text: 'Recreation and activities', value: 3 },
          { id: 'opt5', text: 'Not clearly defined', value: 1 }
        ]
      },
      {
        id: 'q3',
        text: 'Do you have volunteer leaders for your youth ministry?',
        type: 'boolean',
        required: true
      }
    ],
    scoring: {
      method: 'automatic',
      maxScore: 100,
      passingScore: 65,
      weightedQuestions: false
    },
    isPublic: true
  },
  {
    title: 'Financial Stewardship Review',
    description: 'Assess your church\'s financial health and stewardship practices',
    category: 'Finance',
    tier: 'premium',
    difficulty: 'intermediate',
    timeLimit: 35,
    status: 'published',
    tags: ['finance', 'stewardship', 'budget', 'giving'],
    questions: [
      {
        id: 'q1',
        text: 'Does your church have a formal budget process?',
        type: 'boolean',
        required: true
      },
      {
        id: 'q2',
        text: 'How transparent is your church about finances with the congregation?',
        type: 'scale',
        required: true,
        scaleRange: {
          min: 1,
          max: 10,
          step: 1,
          labels: {
            min: 'Not Transparent',
            max: 'Fully Transparent'
          }
        }
      },
      {
        id: 'q3',
        text: 'What percentage of your budget goes to missions and outreach?',
        type: 'scale',
        required: true,
        scaleRange: {
          min: 0,
          max: 50,
          step: 5,
          labels: {
            min: '0%',
            max: '50%+'
          }
        }
      }
    ],
    scoring: {
      method: 'automatic',
      maxScore: 100,
      passingScore: 70,
      weightedQuestions: false
    },
    isPublic: true
  },
  {
    title: 'Worship Service Evaluation',
    description: 'Evaluate the quality and effectiveness of your worship services',
    category: 'Worship',
    tier: 'free',
    difficulty: 'beginner',
    timeLimit: 20,
    status: 'published',
    tags: ['worship', 'service', 'music', 'experience'],
    questions: [
      {
        id: 'q1',
        text: 'Rate the overall quality of your worship music',
        type: 'rating',
        required: true,
        scaleRange: { min: 1, max: 5, step: 1 }
      },
      {
        id: 'q2',
        text: 'How engaging are your sermon messages?',
        type: 'scale',
        required: true,
        scaleRange: {
          min: 1,
          max: 10,
          step: 1,
          labels: {
            min: 'Not Engaging',
            max: 'Highly Engaging'
          }
        }
      },
      {
        id: 'q3',
        text: 'Do you incorporate multimedia elements in worship?',
        type: 'boolean',
        required: true
      }
    ],
    scoring: {
      method: 'automatic',
      maxScore: 100,
      passingScore: 60,
      weightedQuestions: false
    },
    isPublic: true
  }
];

const seedAssessments = async () => {
  try {
    console.log('🌱 Seeding sample assessments...');
    
    // Check if assessments already exist
    const existingAssessments = await Assessment.countDocuments();
    if (existingAssessments > 0) {
      console.log(`⏭️  ${existingAssessments} assessments already exist, skipping seed`);
      return;
    }
    
    // Find an admin user to be the creator
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // If no admin exists, create one for seeding purposes
      console.log('Creating default admin user for seeding...');
      adminUser = await User.create({
        email: 'seed-admin@faithtech.com',
        password: 'SeedAdmin123!',
        firstName: 'Seed',
        lastName: 'Admin',
        role: 'admin',
        emailVerified: true
      });
    }
    
    // Add creator to each assessment
    const assessmentsWithCreator = sampleAssessments.map(assessment => ({
      ...assessment,
      createdBy: adminUser._id,
      publishedAt: new Date(),
      completions: Math.floor(Math.random() * 100) + 20,
      averageScore: Math.floor(Math.random() * 30) + 60,
      averageCompletionTime: Math.floor(Math.random() * 20) + 10
    }));
    
    // Insert all assessments
    const createdAssessments = await Assessment.insertMany(assessmentsWithCreator);
    console.log(`✅ Successfully seeded ${createdAssessments.length} sample assessments`);
    
    return createdAssessments;
  } catch (error) {
    console.error('❌ Error seeding assessments:', error);
    throw error;
  }
};

module.exports = {
  sampleAssessments,
  seedAssessments
};

