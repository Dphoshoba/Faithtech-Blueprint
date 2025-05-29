const validateUser = (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  // Validate email
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  // Validate names
  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'First name and last name are required' });
  }

  // Trim whitespace from inputs
  req.body.email = email.trim().toLowerCase();
  req.body.firstName = firstName.trim();
  req.body.lastName = lastName.trim();

  // Validate input lengths
  if (firstName.length > 50 || lastName.length > 50) {
    return res.status(400).json({ message: 'Name fields cannot exceed 50 characters' });
  }

  if (email.length > 255) {
    return res.status(400).json({ message: 'Email cannot exceed 255 characters' });
  }

  // Check for empty strings after trimming
  if (!req.body.firstName || !req.body.lastName) {
    return res.status(400).json({ message: 'Name fields cannot be empty' });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['firstName', 'lastName', 'email'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  if (req.body.email) {
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    req.body.email = req.body.email.trim().toLowerCase();
  }

  if (req.body.firstName) {
    req.body.firstName = req.body.firstName.trim();
    if (!req.body.firstName || req.body.firstName.length > 50) {
      return res.status(400).json({ message: 'Invalid first name' });
    }
  }

  if (req.body.lastName) {
    req.body.lastName = req.body.lastName.trim();
    if (!req.body.lastName || req.body.lastName.length > 50) {
      return res.status(400).json({ message: 'Invalid last name' });
    }
  }

  next();
};

const validatePasswordReset = (req, res, next) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  next();
};

module.exports = {
  validateUser,
  validateProfileUpdate,
  validatePasswordReset
}; 