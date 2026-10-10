/**
 * Compatibility shim.
 *
 * The canonical implementation lives in `./appError`. Controllers import
 * `{ AppError }` from here, so re-export the named binding.
 */

const AppError = require('./appError');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  errorHandler
};