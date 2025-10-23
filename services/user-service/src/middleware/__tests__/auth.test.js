const jwt = require('jsonwebtoken');
const auth = require('../auth');
const User = require('../../models/User');

// Mock User model
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should return 401 if no token is provided', async () => {
    mockReq.header.mockReturnValue(null);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'No authentication token provided'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockReq.header.mockReturnValue('Bearer invalid-token');
    
    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid authentication token'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: '123' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '0s' }
    );

    mockReq.header.mockReturnValue(`Bearer ${expiredToken}`);

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 1000));

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication token has expired'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found', async () => {
    const token = jwt.sign({ id: 'user-id' }, process.env.JWT_SECRET);
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    User.findById.mockResolvedValue(null);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should set user and token in request if authentication is successful', async () => {
    const user = { id: 'user-id', name: 'Test User', active: true };
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user)
    });

    await auth(mockReq, mockRes, nextFunction);

    expect(mockReq.user).toBe(user);
    expect(mockReq.token).toBe(token);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle server errors gracefully', async () => {
    const token = jwt.sign({ id: 'user-id' }, process.env.JWT_SECRET);
    mockReq.header.mockReturnValue(`Bearer ${token}`);
    const error = new Error('Database error');
    User.findById.mockRejectedValue(error);

    await auth(mockReq, mockRes, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication error',
      error: 'Database error'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
}); 