const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3 } = require('aws-sdk');
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const { User } = require('../models');
const { validatePasswordComplexity } = require('../utils/password');
const { AppError } = require('../middleware/error');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed!', 400));
    }
    cb(null, true);
  }
});

// Configure AWS S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Protect all routes
router.use(auth);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.patch('/profile', async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

// Update profile picture
router.post('/profile/picture', upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const key = `profile-pictures/${req.user._id}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: result.Location },
      { new: true }
    );

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: result.Location
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
});

// Update password
router.post('/update-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Validate new password
    const { isValid, errors } = validatePasswordComplexity(newPassword);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Password validation failed', 
        errors 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error: error.message });
  }
});

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }

    // Generate and save 2FA secret
    const secret = crypto.randomBytes(32).toString('hex');
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    await user.save();

    res.json({ 
      message: '2FA enabled successfully',
      secret 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error enabling 2FA', error: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }

    user.twoFactorSecret = undefined;
    user.twoFactorEnabled = false;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error disabling 2FA', error: error.message });
  }
});

// Delete account
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete
    user.active = false;
    await user.save();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

// Admin routes
router.use(restrictTo('admin'));

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user (admin)
router.patch('/:id', async (req, res) => {
  try {
    const updates = {};
    const allowedUpdates = ['firstName', 'lastName', 'role', 'active'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

// Delete user (admin)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete own account' });
    }

    // Soft delete
    user.active = false;
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

module.exports = router; 