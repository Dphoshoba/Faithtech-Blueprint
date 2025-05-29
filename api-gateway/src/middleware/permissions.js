const axios = require('axios');
const logger = require('../logger');

const permissions = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // Get the authorization token from the request header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'No authorization token provided'
        });
      }

      // Verify the token and get user information
      const response = await axios.get(`${process.env.USER_SERVICE_URL}/api/users/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { user } = response.data;

      // Check if user has the required role
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to access this resource'
        });
      }

      // Attach user information to the request
      req.user = user;
      next();
    } catch (error) {
      logger.error({
        message: 'Permission check failed',
        error: error.message,
        requestId: req.requestId
      });

      if (error.response?.status === 401) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired token'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Error checking permissions'
      });
    }
  };
};

module.exports = permissions; 