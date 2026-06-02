const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  currentBalance: { type: Number, default: 0 }, // Grahak par kitna udhaar baqaya hai
  totalDue: { type: Number, default: 0 },       // Synced field for backward compatibility with POS checkouts
  creditLimit: { type: Number, default: 5000 },  // Max limit kitni hai dukan ke hisab se
  dueDate: { type: String, default: "" }        // Kab tak paisa lautana hai (YYYY-MM-DD)
}, { 
  timestamps: true 
});

// Bidirectional hook to keep currentBalance and totalDue perfectly in sync
customerSchema.pre('save', function(next) {
  if (this.isModified('totalDue') && !this.isModified('currentBalance')) {
    this.currentBalance = this.totalDue;
  } else if (this.isModified('currentBalance') && !this.isModified('totalDue')) {
    this.totalDue = this.currentBalance;
  } else if (this.totalDue !== this.currentBalance) {
    // Fallback if both/neither modified but mismatch
    this.currentBalance = this.totalDue || this.currentBalance || 0;
    this.totalDue = this.currentBalance;
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('Customer', customerSchema);