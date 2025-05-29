const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const templateController = require('../controllers/templateController');
const auth = require('../middleware/auth');

// Validation middleware
const validateTemplate = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['worship', 'outreach', 'discipleship', 'administration', 'other'])
    .withMessage('Invalid category'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ min: 10 })
    .withMessage('Comment must be at least 10 characters long')
];

// Public routes
router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);
router.post('/:id/download', templateController.incrementDownloads);

// Protected routes
router.post('/', auth, validateTemplate, templateController.createTemplate);
router.put('/:id', auth, validateTemplate, templateController.updateTemplate);
router.delete('/:id', auth, templateController.deleteTemplate);
router.post('/:id/reviews', auth, validateReview, templateController.addReview);

module.exports = router; 