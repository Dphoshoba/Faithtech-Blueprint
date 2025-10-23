const mongoose = require('mongoose');
const Assessment = require('../services/assessment-service/src/models/Assessment');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/faithtech-blueprint');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Church Health Survey Assessment
const churchHealthAssessment = {
  title: "Church Health Assessment",
  description: "Help us understand the overall health and vitality of our church community. This assessment covers spiritual growth, worship, community, and leadership effectiveness.",
  timeLimit: 15,
  difficulty: "beginner",
  published: true,
  questions: [
    {
      id: "q1",
      type: "scale",
      text: "How would you rate our church's spiritual growth opportunities?",
      required: true,
      options: [
        { id: "1", text: "1 - Poor" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good" },
        { id: "5", text: "5 - Excellent" }
      ],
      explanation: "Consider Bible studies, discipleship programs, and spiritual development opportunities."
    },
    {
      id: "q2",
      type: "scale",
      text: "How satisfied are you with our worship services?",
      required: true,
      options: [
        { id: "1", text: "1 - Very Dissatisfied" },
        { id: "2", text: "2 - Dissatisfied" },
        { id: "3", text: "3 - Neutral" },
        { id: "4", text: "4 - Satisfied" },
        { id: "5", text: "5 - Very Satisfied" }
      ]
    },
    {
      id: "q3",
      type: "scale",
      text: "How would you rate our church's sense of community?",
      required: true,
      options: [
        { id: "1", text: "1 - Weak" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good" },
        { id: "5", text: "5 - Strong" }
      ]
    },
    {
      id: "q4",
      type: "scale",
      text: "How effective is our church leadership?",
      required: true,
      options: [
        { id: "1", text: "1 - Ineffective" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Effective" },
        { id: "5", text: "5 - Very Effective" }
      ]
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "What best describes your current spiritual journey?",
      required: true,
      options: [
        { id: "a", text: "Growing deeper in faith" },
        { id: "b", text: "Maintaining current level" },
        { id: "c", text: "Struggling with faith" },
        { id: "d", text: "New to faith" }
      ]
    },
    {
      id: "q6",
      type: "multiple-select",
      text: "Which areas of church life are most important to you?",
      required: true,
      options: [
        { id: "a", text: "Worship services" },
        { id: "b", text: "Small groups" },
        { id: "c", text: "Community service" },
        { id: "d", text: "Bible study" },
        { id: "e", text: "Fellowship events" }
      ]
    },
    {
      id: "q7",
      type: "text",
      text: "What is one thing our church does really well?",
      required: false
    },
    {
      id: "q8",
      type: "text",
      text: "What is one area where you'd like to see improvement?",
      required: false
    }
  ],
  settings: {
    shuffleQuestions: false,
    showExplanations: true,
    allowReview: true,
    requireAllQuestions: false
  }
};

// Ministry Effectiveness Assessment
const ministryEffectivenessAssessment = {
  title: "Ministry Effectiveness Survey",
  description: "Evaluate how well our ministries are serving the congregation and community. Help us understand which ministries are most effective and where we can improve.",
  timeLimit: 20,
  difficulty: "intermediate",
  published: true,
  questions: [
    {
      id: "q1",
      type: "scale",
      text: "How well does our children's ministry serve families?",
      required: true,
      options: [
        { id: "1", text: "1 - Poor" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good" },
        { id: "5", text: "5 - Excellent" }
      ]
    },
    {
      id: "q2",
      type: "scale",
      text: "How effective is our youth ministry in engaging teenagers?",
      required: true,
      options: [
        { id: "1", text: "1 - Ineffective" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Effective" },
        { id: "5", text: "5 - Very Effective" }
      ]
    },
    {
      id: "q3",
      type: "scale",
      text: "How well does our small group ministry foster community?",
      required: true,
      options: [
        { id: "1", text: "1 - Poor" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good" },
        { id: "5", text: "5 - Excellent" }
      ]
    },
    {
      id: "q4",
      type: "scale",
      text: "How effective is our outreach ministry in serving the community?",
      required: true,
      options: [
        { id: "1", text: "1 - Ineffective" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Effective" },
        { id: "5", text: "5 - Very Effective" }
      ]
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "Which ministry has had the greatest impact on your spiritual growth?",
      required: true,
      options: [
        { id: "a", text: "Sunday School" },
        { id: "b", text: "Small Groups" },
        { id: "c", text: "Bible Study" },
        { id: "d", text: "Worship" },
        { id: "e", text: "Other" }
      ]
    },
    {
      id: "q6",
      type: "multiple-select",
      text: "Which ministries would you like to see expanded?",
      required: true,
      options: [
        { id: "a", text: "Community outreach" },
        { id: "b", text: "Youth programs" },
        { id: "c", text: "Senior ministry" },
        { id: "d", text: "Family programs" },
        { id: "e", text: "Discipleship training" }
      ]
    },
    {
      id: "q7",
      type: "text",
      text: "Describe a time when a ministry made a significant difference in your life",
      required: false
    },
    {
      id: "q8",
      type: "text",
      text: "What new ministry would you like to see our church start?",
      required: false
    }
  ],
  settings: {
    shuffleQuestions: false,
    showExplanations: true,
    allowReview: true,
    requireAllQuestions: false
  }
};

// Member Engagement Assessment
const memberEngagementAssessment = {
  title: "Member Engagement Assessment",
  description: "Help us understand how connected and engaged our members feel. This assessment measures community connection, participation, and belonging.",
  timeLimit: 12,
  difficulty: "beginner",
  published: true,
  questions: [
    {
      id: "q1",
      type: "scale",
      text: "How connected do you feel to our church community?",
      required: true,
      options: [
        { id: "1", text: "1 - Not Connected" },
        { id: "2", text: "2 - Slightly Connected" },
        { id: "3", text: "3 - Moderately Connected" },
        { id: "4", text: "4 - Well Connected" },
        { id: "5", text: "5 - Very Connected" }
      ]
    },
    {
      id: "q2",
      type: "scale",
      text: "How often do you participate in church activities?",
      required: true,
      options: [
        { id: "1", text: "1 - Rarely" },
        { id: "2", text: "2 - Occasionally" },
        { id: "3", text: "3 - Sometimes" },
        { id: "4", text: "4 - Often" },
        { id: "5", text: "5 - Very Often" }
      ]
    },
    {
      id: "q3",
      type: "scale",
      text: "How well do you know other church members?",
      required: true,
      options: [
        { id: "1", text: "1 - Not Well" },
        { id: "2", text: "2 - Slightly" },
        { id: "3", text: "3 - Moderately" },
        { id: "4", text: "4 - Well" },
        { id: "5", text: "5 - Very Well" }
      ]
    },
    {
      id: "q4",
      type: "scale",
      text: "How likely are you to invite someone to our church?",
      required: true,
      options: [
        { id: "1", text: "1 - Unlikely" },
        { id: "2", text: "2 - Slightly Likely" },
        { id: "3", text: "3 - Moderately Likely" },
        { id: "4", text: "4 - Likely" },
        { id: "5", text: "5 - Very Likely" }
      ]
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "What is your primary way of connecting with the church?",
      required: true,
      options: [
        { id: "a", text: "Sunday worship only" },
        { id: "b", text: "Small groups" },
        { id: "c", text: "Volunteering" },
        { id: "d", text: "Special events" },
        { id: "e", text: "Online engagement" }
      ]
    },
    {
      id: "q6",
      type: "true-false",
      text: "I feel like I belong at this church",
      required: true
    },
    {
      id: "q7",
      type: "true-false",
      text: "I have close friendships within the church",
      required: true
    },
    {
      id: "q8",
      type: "true-false",
      text: "I feel comfortable sharing my struggles with church members",
      required: true
    },
    {
      id: "q9",
      type: "text",
      text: "What would help you feel more connected to our church?",
      required: false
    },
    {
      id: "q10",
      type: "text",
      text: "Share a story about how the church community has supported you",
      required: false
    }
  ],
  settings: {
    shuffleQuestions: false,
    showExplanations: true,
    allowReview: true,
    requireAllQuestions: false
  }
};

// Leadership Development Assessment
const leadershipDevelopmentAssessment = {
  title: "Leadership Development Assessment",
  description: "Help us identify and develop future church leaders. This assessment evaluates leadership interest, skills, and development needs.",
  timeLimit: 18,
  difficulty: "intermediate",
  published: true,
  questions: [
    {
      id: "q1",
      type: "scale",
      text: "How interested are you in taking on leadership roles?",
      required: true,
      options: [
        { id: "1", text: "1 - Not Interested" },
        { id: "2", text: "2 - Slightly Interested" },
        { id: "3", text: "3 - Moderately Interested" },
        { id: "4", text: "4 - Interested" },
        { id: "5", text: "5 - Very Interested" }
      ]
    },
    {
      id: "q2",
      type: "scale",
      text: "How confident do you feel about your leadership abilities?",
      required: true,
      options: [
        { id: "1", text: "1 - Not Confident" },
        { id: "2", text: "2 - Slightly Confident" },
        { id: "3", text: "3 - Moderately Confident" },
        { id: "4", text: "4 - Confident" },
        { id: "5", text: "5 - Very Confident" }
      ]
    },
    {
      id: "q3",
      type: "scale",
      text: "How well do you work with teams?",
      required: true,
      options: [
        { id: "1", text: "1 - Poor" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good" },
        { id: "5", text: "5 - Excellent" }
      ]
    },
    {
      id: "q4",
      type: "scale",
      text: "How comfortable are you speaking in front of groups?",
      required: true,
      options: [
        { id: "1", text: "1 - Uncomfortable" },
        { id: "2", text: "2 - Slightly Comfortable" },
        { id: "3", text: "3 - Moderately Comfortable" },
        { id: "4", text: "4 - Comfortable" },
        { id: "5", text: "5 - Very Comfortable" }
      ]
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "What type of leadership role interests you most?",
      required: true,
      options: [
        { id: "a", text: "Small group leader" },
        { id: "b", text: "Ministry coordinator" },
        { id: "c", text: "Board/committee member" },
        { id: "d", text: "Volunteer coordinator" },
        { id: "e", text: "Worship leader" }
      ]
    },
    {
      id: "q6",
      type: "multiple-select",
      text: "Which leadership skills would you like to develop?",
      required: true,
      options: [
        { id: "a", text: "Public speaking" },
        { id: "b", text: "Team building" },
        { id: "c", text: "Conflict resolution" },
        { id: "d", text: "Strategic planning" },
        { id: "e", text: "Mentoring others" }
      ]
    },
    {
      id: "q7",
      type: "text",
      text: "Describe a time when you demonstrated leadership",
      required: false
    },
    {
      id: "q8",
      type: "text",
      text: "What leadership training or development would be most helpful to you?",
      required: false
    }
  ],
  settings: {
    shuffleQuestions: false,
    showExplanations: true,
    allowReview: true,
    requireAllQuestions: false
  }
};

// Community Outreach Assessment
const communityOutreachAssessment = {
  title: "Community Outreach Impact Assessment",
  description: "Measure the impact of our church's community outreach efforts. Help us understand our community presence and service effectiveness.",
  timeLimit: 15,
  difficulty: "beginner",
  published: true,
  questions: [
    {
      id: "q1",
      type: "scale",
      text: "How well is our church known in the community?",
      required: true,
      options: [
        { id: "1", text: "1 - Not Known" },
        { id: "2", text: "2 - Slightly Known" },
        { id: "3", text: "3 - Moderately Known" },
        { id: "4", text: "4 - Well Known" },
        { id: "5", text: "5 - Very Well Known" }
      ]
    },
    {
      id: "q2",
      type: "scale",
      text: "How effective are our community service projects?",
      required: true,
      options: [
        { id: "1", text: "1 - Ineffective" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Effective" },
        { id: "5", text: "5 - Very Effective" }
      ]
    },
    {
      id: "q3",
      type: "scale",
      text: "How much does our church contribute to community needs?",
      required: true,
      options: [
        { id: "1", text: "1 - Little" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good Amount" },
        { id: "5", text: "5 - A Lot" }
      ]
    },
    {
      id: "q4",
      type: "scale",
      text: "How well do we partner with other community organizations?",
      required: true,
      options: [
        { id: "1", text: "1 - Poor" },
        { id: "2", text: "2 - Below Average" },
        { id: "3", text: "3 - Average" },
        { id: "4", text: "4 - Good" },
        { id: "5", text: "5 - Excellent" }
      ]
    },
    {
      id: "q5",
      type: "multiple-choice",
      text: "What type of community outreach is most important to you?",
      required: true,
      options: [
        { id: "a", text: "Food assistance" },
        { id: "b", text: "Homeless support" },
        { id: "c", text: "Youth programs" },
        { id: "d", text: "Senior services" },
        { id: "e", text: "Disaster relief" }
      ]
    },
    {
      id: "q6",
      type: "multiple-select",
      text: "Which community needs should we focus on?",
      required: true,
      options: [
        { id: "a", text: "Poverty relief" },
        { id: "b", text: "Education support" },
        { id: "c", text: "Healthcare access" },
        { id: "d", text: "Mental health" },
        { id: "e", text: "Family support" }
      ]
    },
    {
      id: "q7",
      type: "text",
      text: "Describe a community outreach experience that impacted you",
      required: false
    },
    {
      id: "q8",
      type: "text",
      text: "What community needs do you see that our church could address?",
      required: false
    }
  ],
  settings: {
    shuffleQuestions: false,
    showExplanations: true,
    allowReview: true,
    requireAllQuestions: false
  }
};

// Seed function
const seedAssessments = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting to seed church assessments...');
    
    // Clear existing assessments (optional - remove if you want to keep existing ones)
    // await Assessment.deleteMany({});
    
    const assessments = [
      churchHealthAssessment,
      ministryEffectivenessAssessment,
      memberEngagementAssessment,
      leadershipDevelopmentAssessment,
      communityOutreachAssessment
    ];
    
    for (const assessmentData of assessments) {
      // Check if assessment already exists
      const existingAssessment = await Assessment.findOne({ title: assessmentData.title });
      
      if (existingAssessment) {
        console.log(`✅ Assessment "${assessmentData.title}" already exists, skipping...`);
        continue;
      }
      
      // Create new assessment
      const assessment = new Assessment({
        ...assessmentData,
        id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      await assessment.save();
      console.log(`✅ Created assessment: "${assessmentData.title}"`);
    }
    
    console.log('🎉 All church assessments have been successfully created!');
    console.log('\n📋 Created Assessments:');
    console.log('1. 🏥 Church Health Assessment');
    console.log('2. 🎯 Ministry Effectiveness Survey');
    console.log('3. 🤝 Member Engagement Assessment');
    console.log('4. 👥 Leadership Development Assessment');
    console.log('5. 🌍 Community Outreach Impact Assessment');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding assessments:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAssessments();
