const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema); 