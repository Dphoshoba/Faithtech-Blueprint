const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request:', req.body);
  
  setTimeout(() => {
    res.json({
      success: true,
      message: 'User registered successfully',
      token: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName
      }
    });
  }, 1000);
});

// Mock login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Login successful',
      token: 'mock-jwt-token',
      user: {
        id: 'mock-user-id',
        email: req.body.email,
        firstName: 'David',
        lastName: 'George'
      }
    });
  }, 500);
});

// Mock subscription endpoint
app.get('/api/subscriptions/current', (req, res) => {
  console.log('Subscription request');
  res.json({
    success: true,
    data: {
      id: 'sub-123',
      userId: 'mock-user-id',
      planId: 'pro',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage: {
        assessments: 5,
        templates: 10,
        apiAccess: 1000,
        storage: 2
      },
      limits: {
        assessments: 100,
        templates: 50,
        apiAccess: 10000,
        storage: 10
      }
    }
  });
});

// Mock assessments list endpoint
app.get('/api/assessments', (req, res) => {
  console.log('Assessments list request');
  
  const assessments = [
    {
      id: 'assessment-1',
      title: 'Church Health Assessment',
      description: 'Evaluate the overall health of your church including worship, community, and outreach',
      timeLimit: 30,
      difficulty: 'intermediate',
      category: 'Church Health',
      tier: 'free',
      totalQuestions: 15,
      averageScore: 78,
      completions: 45,
      tags: ['church', 'health', 'community'],
      status: 'published',
      questions: [
        { 
          id: 'q1', 
          text: 'How would you rate your church attendance growth over the past year?', 
          type: 'scale',
          required: true,
          scaleRange: { min: 1, max: 10, step: 1 }
        },
        { 
          id: 'q2', 
          text: 'What is your church\'s primary mission statement?', 
          type: 'text',
          required: true,
          maxLength: 500
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
        }
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'assessment-2',
      title: 'Leadership Evaluation',
      description: 'Comprehensive assessment of leadership effectiveness and team dynamics',
      timeLimit: 45,
      difficulty: 'advanced',
      category: 'Leadership',
      tier: 'premium',
      totalQuestions: 20,
      averageScore: 82,
      completions: 23,
      tags: ['leadership', 'management', 'team'],
      status: 'published',
      questions: [
        { 
          id: 'q1', 
          text: 'How effective is your leadership team at decision-making?', 
          type: 'scale',
          required: true,
          scaleRange: { min: 1, max: 10, step: 1 }
        },
        {
          id: 'q2',
          text: 'What leadership style best describes your approach?',
          type: 'multiple-choice',
          required: true,
          options: [
            { id: 'opt1', text: 'Servant Leadership', value: 1 },
            { id: 'opt2', text: 'Transformational Leadership', value: 2 },
            { id: 'opt3', text: 'Democratic Leadership', value: 3 },
            { id: 'opt4', text: 'Autocratic Leadership', value: 4 }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'assessment-3',
      title: 'Youth Ministry Assessment',
      description: 'Evaluate the effectiveness and engagement of your youth ministry programs',
      timeLimit: 25,
      difficulty: 'beginner',
      category: 'Youth Ministry',
      tier: 'basic',
      totalQuestions: 12,
      averageScore: 85,
      completions: 67,
      tags: ['youth', 'ministry', 'engagement'],
      status: 'published',
      questions: [
        { 
          id: 'q1', 
          text: 'How many youth regularly attend your programs?', 
          type: 'multiple-choice',
          required: true,
          options: [
            { id: 'opt1', text: '1-10 youth', value: 1 },
            { id: 'opt2', text: '11-25 youth', value: 2 },
            { id: 'opt3', text: '26-50 youth', value: 3 },
            { id: 'opt4', text: '50+ youth', value: 4 }
          ]
        },
        {
          id: 'q2',
          text: 'What types of activities does your youth ministry offer?',
          type: 'multiple-select',
          required: true,
          options: [
            { id: 'opt1', text: 'Bible Study', value: 1 },
            { id: 'opt2', text: 'Community Service', value: 2 },
            { id: 'opt3', text: 'Social Events', value: 3 },
            { id: 'opt4', text: 'Mission Trips', value: 4 }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'assessment-4',
      title: 'Financial Stewardship Review',
      description: 'Assess your church\'s financial health and stewardship practices',
      timeLimit: 35,
      difficulty: 'intermediate',
      category: 'Finance',
      tier: 'premium',
      totalQuestions: 18,
      averageScore: 72,
      completions: 34,
      tags: ['finance', 'stewardship', 'budget'],
      status: 'draft',
      questions: [
        { 
          id: 'q1', 
          text: 'How would you rate your church\'s financial transparency?', 
          type: 'scale',
          required: true,
          scaleRange: { min: 1, max: 10, step: 1 }
        },
        {
          id: 'q2',
          text: 'Does your church have a formal budget process?',
          type: 'true-false',
          required: true
        }
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'assessment-5',
      title: 'Worship Service Evaluation',
      description: 'Evaluate the quality and effectiveness of your worship services',
      timeLimit: 20,
      difficulty: 'beginner',
      category: 'Worship',
      tier: 'free',
      totalQuestions: 10,
      averageScore: 88,
      completions: 89,
      tags: ['worship', 'service', 'music'],
      status: 'published',
      questions: [
        { 
          id: 'q1', 
          text: 'How would you rate the quality of your worship music?', 
          type: 'scale',
          required: true,
          scaleRange: { min: 1, max: 10, step: 1 }
        },
        {
          id: 'q2',
          text: 'What best describes your worship style?',
          type: 'multiple-choice',
          required: true,
          options: [
            { id: 'opt1', text: 'Traditional', value: 1 },
            { id: 'opt2', text: 'Contemporary', value: 2 },
            { id: 'opt3', text: 'Blended', value: 3 },
            { id: 'opt4', text: 'Modern', value: 4 }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Return in the format expected by the frontend (PaginatedResponse format)
  res.json({
    data: assessments,
    total: assessments.length,
    page: 1,
    limit: 10,
    totalPages: 1
  });
});

// Mock user profile endpoint
app.get('/api/users/profile', (req, res) => {
  console.log('User profile request');
  res.json({
    success: true,
    data: {
      id: 'mock-user-id',
      email: 'davidoshoba@gmail.com',
      firstName: 'David',
      lastName: 'George',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  });
});

// Mock user subscription endpoint
app.get('/api/users/subscription', (req, res) => {
  console.log('User subscription request');
  res.json({
    success: true,
    data: {
      planId: 'pro',
      status: 'active'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock server running' });
});

app.get('/', (req, res) => {
  res.json({ 
    service: 'Mock API Server',
    status: 'running',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/subscriptions/current',
      '/api/assessments',
      '/api/users/profile',
      '/api/users/subscription',
      '/health'
    ]
  });
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/auth/register`);
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/api/subscriptions/current`);
  console.log(`  GET  http://localhost:${PORT}/api/assessments`);
  console.log(`  GET  http://localhost:${PORT}/api/users/profile`);
  console.log(`  GET  http://localhost:${PORT}/api/users/subscription`);
});
