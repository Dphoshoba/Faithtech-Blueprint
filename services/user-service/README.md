# User Service Tests

This directory contains comprehensive test suites for the User Service API. The tests cover various aspects of user management, including registration, authentication, profile management, and error handling.

## Test Structure

The test suite is organized into several files:

1. `users.test.js` - Core functionality tests
   - User registration
   - Authentication
   - Profile management
   - Role management
   - Account operations

2. `performance.test.js` - Performance and load testing
   - Concurrent user registration
   - Login performance
   - Database connection pool
   - Response time benchmarks

3. `integration.test.js` - Integration tests with external services
   - Email service integration
   - File upload (S3)
   - Error handling
   - Rate limiting

4. `edge-cases.test.js` - Edge cases and error scenarios
   - Input validation
   - Network errors
   - Database errors
   - Concurrent operations
   - Data consistency

## Running Tests

To run the tests, use the following commands:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm test users.test.js
npm test performance.test.js
npm test integration.test.js
npm test edge-cases.test.js

# Run tests with coverage
npm run test:coverage
```

## Test Environment Setup

The tests require:

1. MongoDB instance (tests will create temporary databases)
2. Node.js v14 or higher
3. Environment variables (see `.env.example`)

## Test Coverage Areas

### 1. User Registration
- Email validation
- Password requirements
- Duplicate prevention
- Input sanitization
- Default role assignment

### 2. Authentication
- Login validation
- Token generation
- Session management
- Password reset flow

### 3. Profile Management
- Profile updates
- Email uniqueness
- File uploads
- Data validation

### 4. Security
- XSS prevention
- NoSQL injection protection
- Rate limiting
- Token validation

### 5. Error Handling
- Input validation errors
- Network failures
- Database errors
- Third-party service failures

### 6. Performance
- Concurrent operations
- Response times
- Database connection pool
- Resource utilization

## Best Practices

1. Always run tests in isolation
2. Use unique database names for test runs
3. Clean up test data after each test
4. Mock external services in integration tests
5. Use appropriate timeouts for async operations

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include both positive and negative test cases
3. Add appropriate documentation
4. Ensure all tests are independent
5. Verify cleanup procedures

## Troubleshooting

Common issues and solutions:

1. **Connection Errors**
   - Verify MongoDB is running
   - Check connection string
   - Ensure network connectivity

2. **Timeout Issues**
   - Adjust Jest timeout settings
   - Check for slow operations
   - Verify resource availability

3. **Failed Tests**
   - Check test isolation
   - Verify mock configurations
   - Ensure cleanup procedures

## Dependencies

- Jest
- Supertest
- MongoDB
- Node.js
- AWS SDK (for S3 tests)
- Nodemailer (for email tests)

## Configuration

Test configuration can be modified in:

- `jest.config.js`
- `jest.setup.js`
- `.env.test`

## Maintenance

Regular maintenance tasks:

1. Update test dependencies
2. Review and update mocks
3. Verify test coverage
4. Update documentation
5. Clean up test databases 