const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const { promisify } = require('util');
const logger = require('../utils/logger');
const { validatePassword } = require('../utils/security');

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict'
  };
  
  res.cookie('jwt', token, cookieOptions);
  
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    
    // Validate password
    if (!validatePassword(password)) {
      return next(new AppError('Password does not meet requirements', 400));
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });
    
    // Generate verification token
    const verificationToken = user.createVerificationToken();
    await user.save();
    
    // Send verification email (implement email service)
    // await sendVerificationEmail(user.email, verificationToken);
    
    logger.logSecurityEvent('user_registered', {
      userId: user._id,
      email: user.email
    });
    
    createSendToken(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // Find user and include password field
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    
    // Check if user exists
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      return next(new AppError('Account is locked. Please try again later', 423));
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      logger.logSecurityEvent('failed_login_attempt', {
        userId: user._id,
        email: user.email,
        attempts: user.loginAttempts
      });
      
      return next(new AppError('Invalid email or password', 401));
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    logger.logSecurityEvent('user_logged_in', {
      userId: user._id,
      email: user.email
    });
    
    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

exports.protect = async (req, res, next) => {
  try {
    // Get token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    // Check if user is active
    if (!user.active) {
      return next(new AppError('Your account has been deactivated.', 401));
    }
    
    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return next(new AppError('There is no user with that email address', 404));
    }
    
    const resetToken = user.createPasswordResetToken();
    await user.save();
    
    // Send password reset email (implement email service)
    // await sendPasswordResetEmail(user.email, resetToken);
    
    logger.logSecurityEvent('password_reset_requested', {
      userId: user._id,
      email: user.email
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
      
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    
    // Validate new password
    if (!validatePassword(req.body.password)) {
      return next(new AppError('Password does not meet requirements', 400));
    }
    
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    logger.logSecurityEvent('password_reset_successful', {
      userId: user._id,
      email: user.email
    });
    
    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return next(new AppError('Your current password is wrong', 401));
    }
    
    // Validate new password
    if (!validatePassword(req.body.newPassword)) {
      return next(new AppError('Password does not meet requirements', 400));
    }
    
    user.password = req.body.newPassword;
    await user.save();
    
    logger.logSecurityEvent('password_updated', {
      userId: user._id,
      email: user.email
    });
    
    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success' });
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
      
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();
    
    logger.logSecurityEvent('email_verified', {
      userId: user._id,
      email: user.email
    });
    
    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

exports.enable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Generate 2FA secret
    const secret = speakeasy.generateSecret();
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = true;
    await user.save();
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(
      speakeasy.otpauthURL({
        secret: secret.base32,
        label: user.email,
        issuer: 'FaithTech'
      })
    );
    
    logger.logSecurityEvent('2fa_enabled', {
      userId: user._id,
      email: user.email
    });
    
    res.status(200).json({
      status: 'success',
      data: { qrCode }
    });
  } catch (error) {
    next(error);
  }
};

exports.verify2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret');
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: req.body.code
    });
    
    if (!verified) {
      return next(new AppError('Invalid 2FA code', 401));
    }
    
    logger.logSecurityEvent('2fa_verified', {
      userId: user._id,
      email: user.email
    });
    
    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
}; 