const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simple registration endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Simulate processing time
  setTimeout(() => {
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: 'mock-user-id',
        email: email,
        firstName: firstName,
        lastName: lastName
      },
      token: 'mock-jwt-token'
    });
  }, 100);
});

// Simple assessments endpoint
app.get('/api/assessments', (req, res) => {
  console.log('Assessments request received');
  
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json({
    data: assessments,
    total: assessments.length,
    page: 1,
    limit: 10,
    totalPages: 1
  });
});

// Simple subscription endpoint
app.get('/api/subscriptions/current', (req, res) => {
  console.log('Subscription request received');
  
  res.json({
    planId: 'free',
    status: 'active',
    usage: {
      assessments: 0,
      templates: 0,
      apiAccess: 0,
      storage: 0
    },
    limits: {
      assessments: 10,
      templates: 5,
      apiAccess: 1000,
      storage: 1
    }
  });
});

const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/auth/register`);
  console.log(`  GET  http://localhost:${PORT}/api/assessments`);
});
