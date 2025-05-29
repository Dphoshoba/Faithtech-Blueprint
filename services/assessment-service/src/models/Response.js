const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: { type: mongoose.Schema.Types.Mixed }
  }],
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Response', ResponseSchema); 