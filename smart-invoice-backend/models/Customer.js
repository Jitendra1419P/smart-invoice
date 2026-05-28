const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  creditLimit: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Customer', customerSchema);