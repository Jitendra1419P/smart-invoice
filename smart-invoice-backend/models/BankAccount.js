const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  accountName: { type: String, required: true, trim: true }, // e.g., "SBI Current A/c", "HDFC Business A/c"
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  currentBalance: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
