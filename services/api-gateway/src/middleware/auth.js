const jwt = require('jsonwebtoken');
const axios = require('axios');

// Cache for blacklisted tokens
const tokenBlacklist = new Set();

// Cache for user data
const userCache = new Map();

// Helper to verify token with auth service
const verifyTokenWithAuthService = async (token) => {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/verify-token`,
      { token },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

// Helper to get user data from auth service
const getUserFromAuthService = async (userId) => {
  try {
    const response = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/users/${userId}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` }
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
};

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Check token blacklist
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        status: 'error',
        message: 'Token has been invalidated'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // If token is expired or invalid, verify with auth service
      const verificationResult = await verifyTokenWithAuthService(token);
      if (!verificationResult) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }
      decoded = verificationResult.user;
    }

    // Get user data from cache or auth service
    let userData = userCache.get(decoded.id);
    if (!userData) {
      userData = await getUserFromAuthService(decoded.id);
      if (!userData) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }
      // Cache user data for 5 minutes
      userCache.set(decoded.id, userData);
      setTimeout(() => userCache.delete(decoded.id), 5 * 60 * 1000);
    }

    // Attach user data to request
    req.user = {
      id: userData._id,
      email: userData.email,
      role: userData.role,
      organization: userData.organization,
      permissions: userData.permissions
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// Middleware to check role
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Middleware to check permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Add token to blacklist
exports.invalidateToken = (token) => {
  tokenBlacklist.add(token);
  // Remove from blacklist after token expiry
  setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000);
};

// Clear user cache
exports.clearUserCache = (userId) => {
  userCache.delete(userId);
}; 