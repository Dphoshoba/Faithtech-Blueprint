const { rolePermissions } = require('../utils/rolesPermissions');

module.exports = function (requiredPermissions) {
  return function (req, res, next) {
    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}; 