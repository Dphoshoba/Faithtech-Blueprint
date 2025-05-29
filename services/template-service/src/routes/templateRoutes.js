const express = require('express');
const { body, query, param } = require('express-validator');
const { protect, restrictTo } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const templateController = require('../controllers/templateController');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { validateTemplate, validateInstance } = require('../middleware/validation');
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  createInstance
} = require('../controllers/templateController');

const {
  getInstances,
  getInstance,
  updateInstance,
  deleteInstance,
  deployInstance
} = require('../controllers/templateInstanceController');

const multer = require('multer');
const uploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();

// Validation rules
const createTemplateValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['worship', 'outreach', 'discipleship', 'administration', 'other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

const updateTemplateValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid template ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['worship', 'outreach', 'discipleship', 'administration', 'other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

const reviewValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid template ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('category')
    .optional()
    .isIn(['worship', 'outreach', 'discipleship', 'administration', 'other'])
    .withMessage('Invalid category'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const versionRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid template ID'),
  body('changes')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Changes description must be between 10 and 500 characters')
];

const statusRules = [
  param('id')
    .isMongoId()
    .withMessage('Invalid template ID'),
  body('status')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
];

// Protect all routes
router.use(auth);

// Routes
router.route('/')
  .post(uploadMulter.single('thumbnail'), validateTemplate, createTemplate)
  .get(getTemplates);

router.get('/search', searchTemplates);

router.route('/:id')
  .get(getTemplate)
  .put(uploadMulter.single('thumbnail'), validateTemplate, updateTemplate)
  .delete(deleteTemplate);

router.post(
  '/:id/reviews',
  protect,
  reviewValidation,
  validate,
  templateController.addReview
);

router.post(
  '/:id/download',
  param('id').isMongoId().withMessage('Invalid template ID'),
  validate,
  templateController.incrementDownloads
);

// New routes for versioning and status
router.post(
  '/:id/versions',
  protect,
  uploadMulter.single('file'),
  versionRules,
  validate,
  templateController.addVersion
);

router.get(
  '/:id/versions',
  param('id').isMongoId().withMessage('Invalid template ID'),
  validate,
  templateController.getVersions
);

router.patch(
  '/:id/status',
  protect,
  statusRules,
  validate,
  templateController.updateStatus
);

// Instance routes
router.post('/:id/instances', validateInstance, createInstance);

router.route('/instances')
  .get(getInstances);

router.route('/instances/:id')
  .get(getInstance)
  .put(validateInstance, updateInstance)
  .delete(deleteInstance);

router.post('/instances/:id/deploy', deployInstance);

// Recommendation routes
router.get(
  '/recommended',
  auth,
  templateController.getRecommendedTemplates
);

router.get(
  '/trending',
  templateController.getTrendingTemplates
);

router.get(
  '/:id/similar',
  templateController.getSimilarTemplates
);

module.exports = router; 