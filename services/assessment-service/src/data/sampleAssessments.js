module.exports = [
  {
    title: 'Ministry Technology Assessment',
    description: 'Evaluate your ministry\'s current technology implementation and identify areas for improvement.',
    type: 'ministry-tech',
    categories: [
      {
        name: 'Digital Presence',
        description: 'Evaluation of online presence and digital footprint',
        weight: 1
      },
      {
        name: 'Communication',
        description: 'Assessment of digital communication tools and strategies',
        weight: 1
      },
      {
        name: 'Technology Infrastructure',
        description: 'Evaluation of hardware, software, and network capabilities',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'Does your ministry have a mobile-responsive website?',
        type: 'multiple-choice',
        category: 'Digital Presence',
        options: [
          { text: 'No website', value: 0 },
          { text: 'Non-responsive website', value: 1 },
          { text: 'Partially responsive', value: 2 },
          { text: 'Fully responsive', value: 3 }
        ],
        weight: 2
      },
      {
        text: 'How would you rate your social media engagement?',
        type: 'likert',
        category: 'Digital Presence',
        options: [
          { text: 'Very Poor', value: 1 },
          { text: 'Poor', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Excellent', value: 5 }
        ],
        weight: 1
      },
      {
        text: 'What digital communication tools do you currently use?',
        type: 'multiple-choice',
        category: 'Communication',
        options: [
          { text: 'Email only', value: 1 },
          { text: 'Email and SMS', value: 2 },
          { text: 'Email, SMS, and App', value: 3 },
          { text: 'Integrated communication platform', value: 4 }
        ],
        weight: 1.5
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 15,
      targetAudience: 'Ministry Leadership',
      prerequisites: ['Basic technology understanding'],
      tags: ['technology', 'digital', 'assessment']
    }
  },
  {
    title: 'Digital Maturity Assessment',
    description: 'Comprehensive evaluation of your organization\'s digital maturity and transformation progress.',
    type: 'digital-maturity',
    categories: [
      {
        name: 'Technology Infrastructure',
        description: 'Assessment of technical capabilities and systems',
        weight: 1
      },
      {
        name: 'Digital Culture',
        description: 'Evaluation of digital adoption and mindset',
        weight: 1
      },
      {
        name: 'Data Management',
        description: 'Assessment of data handling and utilization',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'How would you rate your organization\'s cloud adoption?',
        type: 'likert',
        category: 'Technology Infrastructure',
        options: [
          { text: 'No cloud usage', value: 1 },
          { text: 'Basic cloud storage', value: 2 },
          { text: 'Partial cloud integration', value: 3 },
          { text: 'Full cloud integration', value: 4 },
          { text: 'Advanced cloud implementation', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How is data being used in decision-making processes?',
        type: 'multiple-choice',
        category: 'Data Management',
        options: [
          { text: 'Not used', value: 0 },
          { text: 'Basic reporting only', value: 1 },
          { text: 'Regular analytics', value: 2 },
          { text: 'Advanced analytics and insights', value: 3 }
        ],
        weight: 1.5
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 20,
      targetAudience: 'Organization Leadership',
      prerequisites: ['Basic digital literacy'],
      tags: ['digital transformation', 'maturity', 'assessment']
    }
  }
]; 