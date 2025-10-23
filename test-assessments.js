const axios = require('axios');

// Test the assessments by adding them directly via API
async function testAssessments() {
  console.log('🧪 Testing Church Assessments...\n');
  
  // Test data for one assessment
  const testAssessment = {
    title: "Church Health Assessment",
    description: "Help us understand the overall health and vitality of our church community.",
    type: "church-health",
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
        ]
      },
      {
        id: "q2",
        type: "multiple-choice",
        text: "What best describes your current spiritual journey?",
        required: true,
        options: [
          { id: "a", text: "Growing deeper in faith" },
          { id: "b", text: "Maintaining current level" },
          { id: "c", text: "Struggling with faith" },
          { id: "d", text: "New to faith" }
        ]
      }
    ],
    settings: {
      shuffleQuestions: false,
      showExplanations: true,
      allowReview: true,
      requireAllQuestions: false
    }
  };

  try {
    // Try to connect to the assessment service
    console.log('📡 Testing connection to assessment service...');
    const healthResponse = await axios.get('http://localhost:3002/health', { timeout: 5000 });
    console.log('✅ Assessment service is running:', healthResponse.data);
    
    // Try to get existing assessments
    console.log('\n📋 Fetching existing assessments...');
    const assessmentsResponse = await axios.get('http://localhost:3002/api/assessments');
    console.log(`✅ Found ${assessmentsResponse.data.length} existing assessments`);
    
    // Show existing assessment titles
    if (assessmentsResponse.data.length > 0) {
      console.log('\n📝 Existing assessments:');
      assessmentsResponse.data.forEach((assessment, index) => {
        console.log(`   ${index + 1}. ${assessment.title} (${assessment.type})`);
      });
    }
    
    // Check if our church assessments are already there
    const churchAssessments = assessmentsResponse.data.filter(a => 
      a.type === 'church-health' || 
      a.type === 'ministry-effectiveness' || 
      a.type === 'member-engagement' || 
      a.type === 'leadership-development' || 
      a.type === 'community-outreach'
    );
    
    if (churchAssessments.length > 0) {
      console.log('\n🎉 Church assessments are already loaded!');
      churchAssessments.forEach(assessment => {
        console.log(`   ✅ ${assessment.title}`);
      });
    } else {
      console.log('\n📝 Adding test assessment...');
      const addResponse = await axios.post('http://localhost:3002/api/assessments', testAssessment);
      console.log('✅ Test assessment added successfully!');
      console.log('   ID:', addResponse.data._id);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Assessment service is not running on port 3002');
      console.log('💡 Please start the assessment service first:');
      console.log('   cd services/assessment-service && npm start');
    } else if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run the test
testAssessments();
