const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  features: [{ type: String }]
});

module.exports = mongoose.model('Plan', PlanSchema); 