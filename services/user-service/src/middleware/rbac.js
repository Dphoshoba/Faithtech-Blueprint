const AppError = require('../utils/appError');

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

exports.hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user.permissions) {
      return next(new AppError('You do not have any permissions', 403));
    }

    const hasAllPermissions = permissions.every(permission =>
      req.user.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(new AppError('You do not have the required permissions', 403));
    }

    next();
  };
}; 