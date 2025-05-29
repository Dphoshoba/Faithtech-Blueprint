const { body, validationResult } = require('express-validator');

// Template validation rules
const templateValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 200 })
    .withMessage('Name must be less than 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['church', 'ministry', 'nonprofit', 'event', 'landing-page'])
    .withMessage('Invalid category'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['website', 'email', 'social-media', 'print'])
    .withMessage('Invalid type'),

  body('components')
    .isArray()
    .withMessage('Components must be an array'),

  body('components.*.name')
    .trim()
    .notEmpty()
    .withMessage('Component name is required'),

  body('components.*.type')
    .trim()
    .notEmpty()
    .withMessage('Component type is required')
    .isIn(['header', 'footer', 'navigation', 'content', 'form', 'section'])
    .withMessage('Invalid component type'),

  body('components.*.content')
    .optional()
    .isObject()
    .withMessage('Content must be an object'),

  body('components.*.settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tag cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Tag must be less than 50 characters'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),

  body('metadata.dependencies')
    .optional()
    .isArray()
    .withMessage('Dependencies must be an array'),

  body('metadata.compatibility')
    .optional()
    .isObject()
    .withMessage('Compatibility must be an object')
];

// Instance validation rules
const instanceValidationRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 200 })
    .withMessage('Name must be less than 200 characters'),

  body('customizations')
    .optional()
    .isArray()
    .withMessage('Customizations must be an array'),

  body('customizations.*.componentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid component ID'),

  body('customizations.*.changes')
    .optional()
    .isObject()
    .withMessage('Changes must be an object'),

  body('customizations.*.changes.html')
    .optional()
    .isString()
    .withMessage('HTML changes must be a string'),

  body('customizations.*.changes.css')
    .optional()
    .isString()
    .withMessage('CSS changes must be a string'),

  body('customizations.*.changes.js')
    .optional()
    .isString()
    .withMessage('JS changes must be a string'),

  body('customizations.*.changes.settings')
    .optional()
    .isObject()
    .withMessage('Settings changes must be an object'),

  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object')
];

// Validation middleware
exports.validateTemplate = [
  templateValidationRules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
];

exports.validateInstance = [
  instanceValidationRules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    next();
  }
]; 