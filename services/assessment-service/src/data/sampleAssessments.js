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
  },
  // Church Health Assessment
  {
    title: 'Church Health Assessment',
    description: 'Help us understand the overall health and vitality of our church community. This assessment covers spiritual growth, worship, community, and leadership effectiveness.',
    type: 'church-health',
    categories: [
      {
        name: 'Spiritual Growth',
        description: 'Evaluation of spiritual development opportunities',
        weight: 1
      },
      {
        name: 'Community',
        description: 'Assessment of church community and fellowship',
        weight: 1
      },
      {
        name: 'Leadership',
        description: 'Evaluation of church leadership effectiveness',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'How would you rate our church\'s spiritual growth opportunities?',
        type: 'likert',
        category: 'Spiritual Growth',
        options: [
          { text: 'Poor', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Excellent', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How satisfied are you with our worship services?',
        type: 'likert',
        category: 'Spiritual Growth',
        options: [
          { text: 'Very Dissatisfied', value: 1 },
          { text: 'Dissatisfied', value: 2 },
          { text: 'Neutral', value: 3 },
          { text: 'Satisfied', value: 4 },
          { text: 'Very Satisfied', value: 5 }
        ],
        weight: 1.5
      },
      {
        text: 'How would you rate our church\'s sense of community?',
        type: 'likert',
        category: 'Community',
        options: [
          { text: 'Weak', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Strong', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How effective is our church leadership?',
        type: 'likert',
        category: 'Leadership',
        options: [
          { text: 'Ineffective', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Effective', value: 4 },
          { text: 'Very Effective', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'What best describes your current spiritual journey?',
        type: 'multiple-choice',
        category: 'Spiritual Growth',
        options: [
          { text: 'Growing deeper in faith', value: 4 },
          { text: 'Maintaining current level', value: 3 },
          { text: 'Struggling with faith', value: 2 },
          { text: 'New to faith', value: 3 }
        ],
        weight: 1.5
      },
      {
        text: 'Which areas of church life are most important to you?',
        type: 'multiple-choice',
        category: 'Community',
        options: [
          { text: 'Worship services', value: 1 },
          { text: 'Small groups', value: 1 },
          { text: 'Community service', value: 1 },
          { text: 'Bible study', value: 1 },
          { text: 'Fellowship events', value: 1 }
        ],
        weight: 1
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 15,
      targetAudience: 'Church Members',
      prerequisites: ['Church membership'],
      tags: ['church health', 'spiritual growth', 'community']
    }
  },
  // Ministry Effectiveness Assessment
  {
    title: 'Ministry Effectiveness Survey',
    description: 'Evaluate how well our ministries are serving the congregation and community. Help us understand which ministries are most effective and where we can improve.',
    type: 'ministry-effectiveness',
    categories: [
      {
        name: 'Children & Youth',
        description: 'Evaluation of children and youth ministries',
        weight: 1
      },
      {
        name: 'Adult Ministries',
        description: 'Assessment of adult-focused ministries',
        weight: 1
      },
      {
        name: 'Community Outreach',
        description: 'Evaluation of community service ministries',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'How well does our children\'s ministry serve families?',
        type: 'likert',
        category: 'Children & Youth',
        options: [
          { text: 'Poor', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Excellent', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How effective is our youth ministry in engaging teenagers?',
        type: 'likert',
        category: 'Children & Youth',
        options: [
          { text: 'Ineffective', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Effective', value: 4 },
          { text: 'Very Effective', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How well does our small group ministry foster community?',
        type: 'likert',
        category: 'Adult Ministries',
        options: [
          { text: 'Poor', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Excellent', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How effective is our outreach ministry in serving the community?',
        type: 'likert',
        category: 'Community Outreach',
        options: [
          { text: 'Ineffective', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Effective', value: 4 },
          { text: 'Very Effective', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'Which ministry has had the greatest impact on your spiritual growth?',
        type: 'multiple-choice',
        category: 'Adult Ministries',
        options: [
          { text: 'Sunday School', value: 1 },
          { text: 'Small Groups', value: 1 },
          { text: 'Bible Study', value: 1 },
          { text: 'Worship', value: 1 },
          { text: 'Other', value: 1 }
        ],
        weight: 1.5
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 20,
      targetAudience: 'Church Members',
      prerequisites: ['Ministry participation'],
      tags: ['ministry', 'effectiveness', 'evaluation']
    }
  },
  // Member Engagement Assessment
  {
    title: 'Member Engagement Assessment',
    description: 'Help us understand how connected and engaged our members feel. This assessment measures community connection, participation, and belonging.',
    type: 'member-engagement',
    categories: [
      {
        name: 'Connection',
        description: 'Assessment of member connection to church community',
        weight: 1
      },
      {
        name: 'Participation',
        description: 'Evaluation of member participation in church activities',
        weight: 1
      },
      {
        name: 'Belonging',
        description: 'Assessment of sense of belonging and community',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'How connected do you feel to our church community?',
        type: 'likert',
        category: 'Connection',
        options: [
          { text: 'Not Connected', value: 1 },
          { text: 'Slightly Connected', value: 2 },
          { text: 'Moderately Connected', value: 3 },
          { text: 'Well Connected', value: 4 },
          { text: 'Very Connected', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How often do you participate in church activities?',
        type: 'likert',
        category: 'Participation',
        options: [
          { text: 'Rarely', value: 1 },
          { text: 'Occasionally', value: 2 },
          { text: 'Sometimes', value: 3 },
          { text: 'Often', value: 4 },
          { text: 'Very Often', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How well do you know other church members?',
        type: 'likert',
        category: 'Connection',
        options: [
          { text: 'Not Well', value: 1 },
          { text: 'Slightly', value: 2 },
          { text: 'Moderately', value: 3 },
          { text: 'Well', value: 4 },
          { text: 'Very Well', value: 5 }
        ],
        weight: 1.5
      },
      {
        text: 'How likely are you to invite someone to our church?',
        type: 'likert',
        category: 'Participation',
        options: [
          { text: 'Unlikely', value: 1 },
          { text: 'Slightly Likely', value: 2 },
          { text: 'Moderately Likely', value: 3 },
          { text: 'Likely', value: 4 },
          { text: 'Very Likely', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'I feel like I belong at this church',
        type: 'likert',
        category: 'Belonging',
        options: [
          { text: 'Strongly Disagree', value: 1 },
          { text: 'Disagree', value: 2 },
          { text: 'Neutral', value: 3 },
          { text: 'Agree', value: 4 },
          { text: 'Strongly Agree', value: 5 }
        ],
        weight: 2
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 12,
      targetAudience: 'Church Members',
      prerequisites: ['Church membership'],
      tags: ['engagement', 'community', 'belonging']
    }
  },
  // Leadership Development Assessment
  {
    title: 'Leadership Development Assessment',
    description: 'Help us identify and develop future church leaders. This assessment evaluates leadership interest, skills, and development needs.',
    type: 'leadership-development',
    categories: [
      {
        name: 'Interest',
        description: 'Assessment of leadership interest and motivation',
        weight: 1
      },
      {
        name: 'Skills',
        description: 'Evaluation of current leadership abilities',
        weight: 1
      },
      {
        name: 'Development',
        description: 'Assessment of leadership development needs',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'How interested are you in taking on leadership roles?',
        type: 'likert',
        category: 'Interest',
        options: [
          { text: 'Not Interested', value: 1 },
          { text: 'Slightly Interested', value: 2 },
          { text: 'Moderately Interested', value: 3 },
          { text: 'Interested', value: 4 },
          { text: 'Very Interested', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How confident do you feel about your leadership abilities?',
        type: 'likert',
        category: 'Skills',
        options: [
          { text: 'Not Confident', value: 1 },
          { text: 'Slightly Confident', value: 2 },
          { text: 'Moderately Confident', value: 3 },
          { text: 'Confident', value: 4 },
          { text: 'Very Confident', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How well do you work with teams?',
        type: 'likert',
        category: 'Skills',
        options: [
          { text: 'Poor', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Excellent', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How comfortable are you speaking in front of groups?',
        type: 'likert',
        category: 'Skills',
        options: [
          { text: 'Uncomfortable', value: 1 },
          { text: 'Slightly Comfortable', value: 2 },
          { text: 'Moderately Comfortable', value: 3 },
          { text: 'Comfortable', value: 4 },
          { text: 'Very Comfortable', value: 5 }
        ],
        weight: 1.5
      },
      {
        text: 'What type of leadership role interests you most?',
        type: 'multiple-choice',
        category: 'Interest',
        options: [
          { text: 'Small group leader', value: 1 },
          { text: 'Ministry coordinator', value: 1 },
          { text: 'Board/committee member', value: 1 },
          { text: 'Volunteer coordinator', value: 1 },
          { text: 'Worship leader', value: 1 }
        ],
        weight: 1
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 18,
      targetAudience: 'Potential Leaders',
      prerequisites: ['Church membership'],
      tags: ['leadership', 'development', 'training']
    }
  },
  // Community Outreach Assessment
  {
    title: 'Community Outreach Impact Assessment',
    description: 'Measure the impact of our church\'s community outreach efforts. Help us understand our community presence and service effectiveness.',
    type: 'community-outreach',
    categories: [
      {
        name: 'Community Presence',
        description: 'Assessment of church visibility in community',
        weight: 1
      },
      {
        name: 'Service Effectiveness',
        description: 'Evaluation of community service impact',
        weight: 1
      },
      {
        name: 'Partnerships',
        description: 'Assessment of community partnerships',
        weight: 1
      }
    ],
    questions: [
      {
        text: 'How well is our church known in the community?',
        type: 'likert',
        category: 'Community Presence',
        options: [
          { text: 'Not Known', value: 1 },
          { text: 'Slightly Known', value: 2 },
          { text: 'Moderately Known', value: 3 },
          { text: 'Well Known', value: 4 },
          { text: 'Very Well Known', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How effective are our community service projects?',
        type: 'likert',
        category: 'Service Effectiveness',
        options: [
          { text: 'Ineffective', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Effective', value: 4 },
          { text: 'Very Effective', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How much does our church contribute to community needs?',
        type: 'likert',
        category: 'Service Effectiveness',
        options: [
          { text: 'Little', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good Amount', value: 4 },
          { text: 'A Lot', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'How well do we partner with other community organizations?',
        type: 'likert',
        category: 'Partnerships',
        options: [
          { text: 'Poor', value: 1 },
          { text: 'Below Average', value: 2 },
          { text: 'Average', value: 3 },
          { text: 'Good', value: 4 },
          { text: 'Excellent', value: 5 }
        ],
        weight: 2
      },
      {
        text: 'What type of community outreach is most important to you?',
        type: 'multiple-choice',
        category: 'Service Effectiveness',
        options: [
          { text: 'Food assistance', value: 1 },
          { text: 'Homeless support', value: 1 },
          { text: 'Youth programs', value: 1 },
          { text: 'Senior services', value: 1 },
          { text: 'Disaster relief', value: 1 }
        ],
        weight: 1
      }
    ],
    status: 'published',
    metadata: {
      estimatedTime: 15,
      targetAudience: 'Church Members',
      prerequisites: ['Community involvement'],
      tags: ['outreach', 'community', 'service']
    }
  }
]; 