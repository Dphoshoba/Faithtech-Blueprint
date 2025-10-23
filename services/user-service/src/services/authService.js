const User = require('../models/User');
const { sendEmail } = require('../utils/email');
const { validatePasswordComplexity } = require('../utils/password');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password complexity
    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      const verificationURL = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: email,
        subject: 'Verify your email address',
        text: `Please verify your email by clicking on this link: ${verificationURL}`,
        html: `
          <h2>Welcome to FaithTech Blueprint!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationURL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } catch (emailError) {
      console.log('Email sending failed (continuing with registration):', emailError.message);
      // Continue with registration even if email fails
    }

    // Generate JWT token
    const token = await user.generateAuthToken();

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified
      },
      token
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user and include password and active status for comparison
    const user = await User.findOne({ email }).select('+password +active');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active (explicitly check for false since active defaults to true)
    if (user.active === false) {
      throw new Error('Account has been deactivated');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = await user.generateAuthToken();

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin
      },
      token
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified
      }
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If an account with that email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    try {
      const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: 'Reset your password',
        text: `Click this link to reset your password: ${resetURL}`,
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetURL}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
        `
      });
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
      throw new Error('Failed to send password reset email');
    }

    return { message: 'If an account with that email exists, a password reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate new password
    const passwordValidation = validatePasswordComplexity(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      subscription: user.subscription,
      createdAt: user.createdAt
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const allowedUpdates = ['firstName', 'lastName', 'profilePicture'];
    const updates = Object.keys(updateData).filter(key => allowedUpdates.includes(key));
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    updates.forEach(update => {
      user[update] = updateData[update];
    });

    user.updatedAt = new Date();
    await user.save();

    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profilePicture: user.profilePicture,
      emailVerified: user.emailVerified,
      updatedAt: user.updatedAt
    };
  }
}

module.exports = new AuthService();
