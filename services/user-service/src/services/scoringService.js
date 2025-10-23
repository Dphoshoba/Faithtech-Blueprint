/**
 * Scoring Service
 * Handles automatic scoring of assessment responses
 */

/**
 * Calculate score for a single question response
 * @param {Object} question - The question object from assessment
 * @param {any} answer - The user's answer
 * @returns {number} - Score for this question
 */
const calculateQuestionScore = (question, answer) => {
  if (!answer && answer !== 0 && answer !== false) {
    return 0;
  }

  switch (question.type) {
    case 'multiple-choice':
      // Find the selected option and return its value
      const selectedOption = question.options?.find(opt => opt.id === answer);
      return selectedOption?.value || 0;

    case 'scale':
      // Scale questions: normalize to 0-100 based on range
      if (question.scaleRange) {
        const { min, max } = question.scaleRange;
        const normalized = ((answer - min) / (max - min)) * 100;
        return Math.round(normalized);
      }
      return 0;

    case 'rating':
      // Rating questions: normalize to 0-100 based on max rating
      if (question.scaleRange) {
        const maxRating = question.scaleRange.max || 5;
        const normalized = (answer / maxRating) * 100;
        return Math.round(normalized);
      }
      return 0;

    case 'boolean':
      // Boolean questions: true = 100, false = 0
      return answer === true ? 100 : 0;

    case 'text':
      // Text questions: score based on completion and length
      if (typeof answer === 'string') {
        const minLength = question.minLength || 0;
        const providedLength = answer.trim().length;
        
        if (providedLength === 0) return 0;
        if (minLength === 0) return 100; // If no minimum, full credit for any answer
        
        // Partial credit based on meeting minimum length
        const lengthRatio = Math.min(providedLength / minLength, 1);
        return Math.round(lengthRatio * 100);
      }
      return 0;

    default:
      return 0;
  }
};

/**
 * Calculate total score for an assessment response
 * @param {Object} assessment - The assessment object with questions
 * @param {Array} responses - Array of response objects with questionId and answer
 * @returns {Object} - Scoring result with total, percentage, breakdown, etc.
 */
const calculateAssessmentScore = (assessment, responses) => {
  const { questions, scoring } = assessment;
  const weightedQuestions = scoring?.weightedQuestions || false;
  const maxScore = scoring?.maxScore || 100;
  const passingScore = scoring?.passingScore || 70;

  // Create a map of responses for easy lookup
  const responseMap = new Map();
  responses.forEach(resp => {
    responseMap.set(resp.questionId, resp.answer);
  });

  // Calculate scores for each question
  const questionScores = questions.map((question, index) => {
    const answer = responseMap.get(question.id);
    const rawScore = calculateQuestionScore(question, answer);
    
    // Apply weight if weighted scoring is enabled
    const weight = weightedQuestions && question.weight ? question.weight : 1;
    const weightedScore = rawScore * weight;

    return {
      questionId: question.id,
      questionNumber: index + 1,
      questionText: question.text,
      answer,
      rawScore,
      weight,
      weightedScore,
      maxPossible: 100 * weight
    };
  });

  // Calculate totals
  const totalRawScore = questionScores.reduce((sum, q) => sum + q.rawScore, 0);
  const totalWeightedScore = questionScores.reduce((sum, q) => sum + q.weightedScore, 0);
  const totalMaxPossible = questionScores.reduce((sum, q) => sum + q.maxPossible, 0);

  // Calculate percentage
  const percentage = totalMaxPossible > 0 
    ? Math.round((totalWeightedScore / totalMaxPossible) * 100) 
    : 0;

  // Scale to maxScore
  const finalScore = Math.round((percentage / 100) * maxScore);

  // Determine pass/fail
  const passed = percentage >= passingScore;

  // Calculate category scores (if questions have categories)
  const categoryScores = calculateCategoryScores(questions, questionScores);

  return {
    totalScore: finalScore,
    maxScore,
    percentage,
    passed,
    passingScore,
    questionScores,
    categoryScores,
    summary: {
      totalQuestions: questions.length,
      answeredQuestions: responses.length,
      correctAnswers: questionScores.filter(q => q.rawScore >= 70).length,
      averageScore: Math.round(totalRawScore / questions.length)
    }
  };
};

/**
 * Calculate scores by category
 * @param {Array} questions - Array of questions
 * @param {Array} questionScores - Array of calculated scores
 * @returns {Object} - Scores grouped by category
 */
const calculateCategoryScores = (questions, questionScores) => {
  const categories = {};

  questionScores.forEach((score, index) => {
    const question = questions[index];
    const category = question.category || 'General';

    if (!categories[category]) {
      categories[category] = {
        name: category,
        scores: [],
        total: 0,
        count: 0,
        average: 0
      };
    }

    categories[category].scores.push(score.rawScore);
    categories[category].total += score.rawScore;
    categories[category].count += 1;
  });

  // Calculate averages
  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    cat.average = Math.round(cat.total / cat.count);
  });

  return categories;
};

/**
 * Generate feedback based on score
 * @param {Object} scoringResult - Result from calculateAssessmentScore
 * @param {Object} assessment - The assessment object
 * @returns {Object} - Feedback with strengths, improvements, and recommendations
 */
const generateFeedback = (scoringResult, assessment) => {
  const { percentage, categoryScores, questionScores } = scoringResult;

  // Overall feedback based on percentage
  let overallFeedback = '';
  if (percentage >= 90) {
    overallFeedback = 'Excellent work! You demonstrate strong understanding across all areas.';
  } else if (percentage >= 80) {
    overallFeedback = 'Great job! You show solid competency with room for minor improvements.';
  } else if (percentage >= 70) {
    overallFeedback = 'Good effort! You meet the requirements with some areas for growth.';
  } else if (percentage >= 60) {
    overallFeedback = 'Fair performance. Focus on strengthening key areas to improve.';
  } else {
    overallFeedback = 'Additional work needed. Consider reviewing the material and trying again.';
  }

  // Identify strengths (categories with high scores)
  const strengths = Object.values(categoryScores)
    .filter(cat => cat.average >= 80)
    .map(cat => `${cat.name} (${cat.average}%)`);

  // Identify areas for improvement (categories with low scores)
  const areasForImprovement = Object.values(categoryScores)
    .filter(cat => cat.average < 70)
    .map(cat => `${cat.name} (${cat.average}%)`);

  // Generate recommendations based on weak areas
  const recommendations = [];
  if (areasForImprovement.length > 0) {
    recommendations.push(`Focus on improving your understanding of: ${areasForImprovement.join(', ')}`);
  }
  if (percentage < 70) {
    recommendations.push('Consider reviewing the assessment materials before retaking');
    recommendations.push('Reach out for additional support or resources');
  }
  if (questionScores.some(q => q.rawScore === 0)) {
    recommendations.push('Make sure to answer all questions - unanswered questions receive zero points');
  }

  // Identify questions that need attention (scored below 50%)
  const questionsNeedingAttention = questionScores
    .filter(q => q.rawScore < 50)
    .map(q => ({
      number: q.questionNumber,
      text: q.questionText.substring(0, 100) + '...',
      score: q.rawScore
    }));

  return {
    overallFeedback,
    strengths: strengths.length > 0 ? strengths : ['Continue building on your current knowledge base'],
    areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['Maintain your current performance level'],
    recommendations: recommendations.length > 0 ? recommendations : ['Keep up the great work!'],
    questionsNeedingAttention: questionsNeedingAttention.slice(0, 5), // Top 5 questions
    detailedFeedback: Object.values(categoryScores).map(cat => ({
      category: cat.name,
      score: cat.average,
      feedback: cat.average >= 80 
        ? `Strong performance in ${cat.name}` 
        : cat.average >= 60 
          ? `Moderate understanding of ${cat.name}` 
          : `Need more work on ${cat.name}`
    }))
  };
};

module.exports = {
  calculateQuestionScore,
  calculateAssessmentScore,
  calculateCategoryScores,
  generateFeedback
};

