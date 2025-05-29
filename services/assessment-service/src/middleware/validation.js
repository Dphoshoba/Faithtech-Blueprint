const { body, validationResult } = require('express-validator');

// Validation rules for assessment
const assessmentValidationRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['ministry-tech', 'digital-maturity', 'custom'])
    .withMessage('Invalid assessment type'),

  body('questions')
    .isArray()
    .withMessage('Questions must be an array')
    .notEmpty()
    .withMessage('At least one question is required'),

  body('questions.*.text')
    .trim()
    .notEmpty()
    .withMessage('Question text is required')
    .isLength({ max: 500 })
    .withMessage('Question text must be less than 500 characters'),

  body('questions.*.type')
    .trim()
    .notEmpty()
    .withMessage('Question type is required')
    .isIn(['multiple-choice', 'likert', 'open-ended', 'boolean'])
    .withMessage('Invalid question type'),

  body('questions.*.category')
    .trim()
    .notEmpty()
    .withMessage('Question category is required'),

  body('questions.*.options')
    .if(body('questions.*.type').isIn(['multiple-choice', 'likert']))
    .isArray()
    .withMessage('Options must be an array for multiple-choice or likert questions')
    .notEmpty()
    .withMessage('At least one option is required'),

  body('questions.*.options.*.text')
    .if(body('questions.*.type').isIn(['multiple-choice', 'likert']))
    .trim()
    .notEmpty()
    .withMessage('Option text is required'),

  body('questions.*.options.*.value')
    .if(body('questions.*.type').isIn(['multiple-choice', 'likert']))
    .isNumeric()
    .withMessage('Option value must be a number'),

  body('categories')
    .isArray()
    .withMessage('Categories must be an array')
    .notEmpty()
    .withMessage('At least one category is required'),

  body('categories.*.name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required'),

  body('categories.*.weight')
    .optional()
    .isNumeric()
    .withMessage('Category weight must be a number')
];

// Validation middleware
exports.validateAssessment = [
  assessmentValidationRules,
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

// Validation rules for assessment response
const responseValidationRules = [
  body('answers')
    .isArray()
    .withMessage('Answers must be an array')
    .notEmpty()
    .withMessage('At least one answer is required'),

  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .isMongoId()
    .withMessage('Invalid question ID'),

  body('answers.*.value')
    .notEmpty()
    .withMessage('Answer value is required'),

  body('answers.*.notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Validation middleware for responses
exports.validateResponse = [
  responseValidationRules,
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