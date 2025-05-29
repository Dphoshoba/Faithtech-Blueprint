const jwt = require('jsonwebtoken');
const { rolePermissions } = require('./rolesPermissions');

const generateJWT = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

module.exports = generateJWT; 