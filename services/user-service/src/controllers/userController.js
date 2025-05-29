const User = require('../models/User');
const AppError = require('../utils/appError');

// Get all users (with pagination and filtering)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const users = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -passwordResetToken -passwordResetExpires');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    // Don't allow password updates through this route
    if (req.body.password) {
      return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400));
    }

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Only allow admins to update roles and permissions
    if (req.body.role || req.body.permissions) {
      if (req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to modify roles or permissions', 403));
      }
    }

    // Update user fields
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: req.body.role,
        permissions: req.body.permissions,
        active: req.body.active
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password -passwordResetToken -passwordResetExpires');

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res, next) => {
  try {
    // Only allow admins to delete users
    if (req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to delete users', 403));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Soft delete by setting active to false
    user.active = false;
    await user.save();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -passwordResetToken -passwordResetExpires');

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
exports.updateProfile = async (req, res, next) => {
  try {
    // Don't allow password updates through this route
    if (req.body.password) {
      return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400));
    }

    // Don't allow role or permission updates through this route
    if (req.body.role || req.body.permissions) {
      return next(new AppError('You cannot update your role or permissions', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password -passwordResetToken -passwordResetExpires');

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
}; 