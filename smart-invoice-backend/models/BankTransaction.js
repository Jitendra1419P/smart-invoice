const mongoose = require('mongoose');

const BankTransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  type: { type: String, enum: ['Deposit', 'Withdrawal'], required: true },
  method: { type: String, enum: ['UPI', 'NEFT/RTGS', 'Cash', 'Cheque'], required: true },
  amount: { type: Number, required: true },
  referenceNumber: { type: String, default: "" }, // UPI Ref Number ya Cheque Number
  chequeStatus: { type: String, enum: ['None', 'Pending', 'Cleared', 'Bounced'], default: 'None' },
  partyName: { type: String, default: "Self" }, // Kisko diya ya kisse aaya (Customer/Supplier name)
  date: { type: String, required: true }, // YYYY-MM-DD
  description: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('BankTransaction', BankTransactionSchema);
