const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { validateAssessment } = require('../middleware/validation');
const {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  getResponse,
  submitResponse
} = require('../controllers/assessmentController');

// Protect all routes
router.use(auth);

// Assessment routes
router.route('/')
  .post(validateAssessment, createAssessment)
  .get(getAssessments);

router.route('/:id')
  .get(getAssessment)
  .put(validateAssessment, updateAssessment)
  .delete(deleteAssessment);

// Response routes
router.post('/:id/submit', submitResponse);
router.get('/results/:responseId', getResponse);

module.exports = router; 