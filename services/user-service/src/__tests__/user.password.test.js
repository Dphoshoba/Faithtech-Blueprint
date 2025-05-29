const mongoose = require('mongoose');
const { User } = require('../models');

describe('User Password Management', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user-service-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  it('should hash password on user creation', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await User.create(userData);
    
    // Password should be hashed
    expect(user.password).not.toBe(userData.password);
    expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[A-Za-z0-9./]{53}$/);
  });

  it('should correctly verify valid password', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await User.create(userData);
    const isValid = await user.comparePassword(userData.password);
    
    expect(isValid).toBe(true);
  });

  it('should correctly reject invalid password', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await User.create(userData);
    const isValid = await user.comparePassword('WrongPassword123!');
    
    expect(isValid).toBe(false);
  });

  it('should not rehash password if unmodified', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const user = await User.create(userData);
    const originalHash = user.password;

    // Update user without changing password
    user.firstName = 'Updated';
    await user.save();

    expect(user.password).toBe(originalHash);
  });
}); 