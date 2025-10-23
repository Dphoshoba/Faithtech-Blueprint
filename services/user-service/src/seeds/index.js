const mongoose = require('mongoose');
const { seedSubscriptionPlans } = require('./subscriptionPlans');
const { seedAssessments } = require('./assessments');
const { seedTemplates } = require('./templates');

const runSeeds = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('='.repeat(50));
    
    // Seed subscription plans first
    await seedSubscriptionPlans();
    
    // Seed sample assessments
    await seedAssessments();
    
    // Seed sample templates
    await seedTemplates();
    
    console.log('='.repeat(50));
    console.log('✅ All seeds completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    throw error;
  }
};

// If run directly (not imported)
if (require.main === module) {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/faithtech-blueprint';
  
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected for seeding');
    return runSeeds();
  })
  .then(() => {
    console.log('🎉 Seeding complete, closing connection...');
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('👋 Connection closed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { runSeeds };

