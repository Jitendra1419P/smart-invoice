const express = require("express");
const router = express.Router();
const BankAccount = require("../models/BankAccount");
const BankTransaction = require("../models/BankTransaction");
const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");

// Get combined cash-flow reports
router.get("/cash-flow", async (req, res) => {
  try {
    const bankAccounts = await BankAccount.find();
    const totalBankCash = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    const pendingChequesIssued = await BankTransaction.countDocuments({
      type: "Withdrawal",
      method: "Cheque",
      chequeStatus: "Pending"
    });

    const pendingChequesReceived = await BankTransaction.countDocuments({
      type: "Deposit",
      method: "Cheque",
      chequeStatus: "Pending"
    });

    // Estimate Cash in Hand based on Cash sales, cash expenses, and bank cash deposits/withdrawals
    const cashInvoices = await Invoice.find({ paymentMode: "Cash" });
    const totalCashSales = cashInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const cashExpenses = await Expense.find({ paymentMethod: "Cash" });
    const totalCashExpenses = cashExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const cashTransactions = await BankTransaction.find({ method: "Cash" });
    const totalCashDeposited = cashTransactions
      .filter(t => t.type === "Deposit")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCashWithdrawn = cashTransactions
      .filter(t => t.type === "Withdrawal")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
    const cashInHand = cashAcc ? cashAcc.currentBalance : Math.max(
      0,
      totalCashSales - totalCashExpenses - totalCashDeposited + totalCashWithdrawn
    );

    res.json({
      totalBankCash,
      pendingChequesIssued,
      pendingChequesReceived,
      cashInHand,
      totalCashSales,
      totalCashExpenses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
