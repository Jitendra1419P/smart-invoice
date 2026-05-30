const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

// Get all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new expense
router.post("/", async (req, res) => {
  try {
    const { category, amount, description, paymentMethod, selectedBankId, date } = req.body;

    let targetBankId = selectedBankId;
    if (paymentMethod === "Cash" && amount > 0) {
      const BankAccount = require("../models/BankAccount");
      const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
      if (cashAcc) {
        targetBankId = cashAcc._id;
      }
    }

    if (targetBankId && amount > 0 && (paymentMethod === "Cheque" || paymentMethod === "UPI" || paymentMethod === "Cash")) {
      const BankAccount = require("../models/BankAccount");
      const BankTransaction = require("../models/BankTransaction");

      // 1. Bank account se capital deduct karo
      await BankAccount.findOneAndUpdate(
        { _id: targetBankId },
        { $inc: { currentBalance: -Number(amount) } }
      );

      // 2. Automated Bank Transaction log add karo
      const bankLog = new BankTransaction({
        accountId: targetBankId,
        type: "Withdrawal",
        method: paymentMethod,
        amount: Number(amount),
        chequeStatus: paymentMethod === "Cheque" ? "Pending" : "None",
        partyName: description || category || "Expense",
        date: date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        description: `Expense: ${category} - ${description || ""}`
      });
      await bankLog.save();
    }

    const newExpense = new Expense(req.body);
    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an expense
router.put("/:id", async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedExpense)
      return res.status(404).json({ message: "Expense not found" });
    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an expense
router.delete("/:id", async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense)
      return res.status(404).json({ message: "Expense not found" });

    // Bank rollback integration
    let rollbackBankId = deletedExpense.selectedBankId;
    if (deletedExpense.paymentMethod === "Cash") {
      const BankAccount = require("../models/BankAccount");
      const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
      if (cashAcc) {
        rollbackBankId = cashAcc._id;
      }
    }

    if (rollbackBankId && (deletedExpense.paymentMethod === "Cheque" || deletedExpense.paymentMethod === "UPI" || deletedExpense.paymentMethod === "Cash")) {
      const BankAccount = require("../models/BankAccount");
      const BankTransaction = require("../models/BankTransaction");

      // 1. Increment Bank balance back by the expense amount (reversing withdrawal)
      await BankAccount.findOneAndUpdate(
        { _id: rollbackBankId },
        { $inc: { currentBalance: Number(deletedExpense.amount) } }
      );

      // 2. Remove matching transaction ledger log
      await BankTransaction.findOneAndDelete({
        accountId: rollbackBankId,
        type: "Withdrawal",
        method: deletedExpense.paymentMethod,
        amount: Number(deletedExpense.amount),
        partyName: deletedExpense.description || deletedExpense.category || "Expense"
      });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
