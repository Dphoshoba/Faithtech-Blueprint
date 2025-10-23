const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { validatePasswordComplexity } = require('../utils/password');
const { sendEmail } = require('../utils/email');
const { authLimiter } = require('../middleware/security.middleware');
const auth = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password complexity
    const { isValid, errors } = validatePasswordComplexity(password);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Password validation failed', 
        errors 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    await user.save();

    // Send verification email (with timeout and error handling)
    try {
      const verificationURL = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await Promise.race([
        sendEmail({
          to: email,
          subject: 'Verify your email',
          text: `Please verify your email by clicking on this link: ${verificationURL}`
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 5000))
      ]);
    } catch (emailError) {
      console.log('Email sending failed (continuing with registration):', emailError.message);
      // Continue with registration even if email fails
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(401).json({ 
        message: 'Account is locked due to too many failed attempts. Please try again later.' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.handleFailedLogin();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send password reset email (with timeout and error handling)
    try {
      const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await Promise.race([
        sendEmail({
          to: user.email,
          subject: 'Reset your password',
          text: `Click this link to reset your password: ${resetURL}`
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 5000))
      ]);
    } catch (emailError) {
      console.log('Email sending failed (continuing with password reset):', emailError.message);
      // Continue even if email fails
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting password reset', error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const { isValid, errors } = validatePasswordComplexity(req.body.password);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Password validation failed', 
        errors 
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Remove the current token
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
});

// Logout all devices
router.post('/logout-all', auth, async (req, res) => {
  try {
    // Remove all tokens
    req.user.tokens = [];
    await req.user.save();
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out from all devices', error: error.message });
  }
});

// Get CSRF token
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

module.exports = router; 