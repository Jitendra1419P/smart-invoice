const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  accountName: { type: String, required: true, default: "HDFC Business A/c" },
  bankName: { type: String, default: "HDFC Bank" },
  accountNumber: { type: String, default: "XXXX-XXXX-9843" },
  ifscCode: { type: String, default: "HDFC0000001" },
  currentBalance: { type: Number, required: true, default: 482500 } // Opening balance
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
