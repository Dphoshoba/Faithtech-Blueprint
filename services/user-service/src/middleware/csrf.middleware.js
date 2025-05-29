const csrf = require('csurf');

// Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  }
});

// CSRF error handler
const handleCSRFError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Handle CSRF token validation errors
  res.status(403).json({
    status: 'error',
    message: 'Invalid or missing CSRF token'
  });
};

module.exports = {
  csrfProtection,
  handleCSRFError
}; 