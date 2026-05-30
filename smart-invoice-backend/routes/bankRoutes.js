const express = require("express");
const router = express.Router();
const BankAccount = require("../models/BankAccount");
const BankTransaction = require("../models/BankTransaction");

// 1. Get all bank accounts
router.get("/", async (req, res) => {
  try {
    const accounts = await BankAccount.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Create a new bank account
router.post("/", async (req, res) => {
  try {
    const newAccount = new BankAccount(req.body);
    const savedAccount = await newAccount.save();
    res.status(201).json(savedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. Get all bank transaction logs
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await BankTransaction.find()
      .populate("accountId")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Create a manual transaction / Transfer
router.post("/transactions", async (req, res) => {
  const { accountId, type, method, amount, referenceNumber, partyName, date, description, transferTargetAccountId } = req.body;
  try {
    const BankAccount = require("../models/BankAccount");
    const BankTransaction = require("../models/BankTransaction");

    // Case A: Fund Transfer between accounts
    if (type === "Transfer" && transferTargetAccountId) {
      // 1. Decrement Source Account balance
      await BankAccount.findByIdAndUpdate(
        accountId,
        { $inc: { currentBalance: -Number(amount) } }
      );

      // 2. Increment Target Account balance
      await BankAccount.findByIdAndUpdate(
        transferTargetAccountId,
        { $inc: { currentBalance: Number(amount) } }
      );

      const sourceAcc = await BankAccount.findById(accountId);
      const targetAcc = await BankAccount.findById(transferTargetAccountId);

      // 3. Log Withdrawal on Source Account
      const sourceLog = new BankTransaction({
        accountId,
        type: "Withdrawal",
        method,
        amount: Number(amount),
        referenceNumber: referenceNumber || "",
        chequeStatus: method === "Cheque" ? "Pending" : "None",
        partyName: targetAcc ? targetAcc.accountName : "Transfer Account",
        date: date || new Date().toISOString().split("T")[0],
        description: `Fund Transfer to ${targetAcc ? targetAcc.accountName : "Transfer Account"}: ${description || ""}`
      });
      await sourceLog.save();

      // 4. Log Deposit on Target Account
      const targetLog = new BankTransaction({
        accountId: transferTargetAccountId,
        type: "Deposit",
        method,
        amount: Number(amount),
        referenceNumber: referenceNumber || "",
        chequeStatus: "None",
        partyName: sourceAcc ? sourceAcc.accountName : "Self Transfer",
        date: date || new Date().toISOString().split("T")[0],
        description: `Fund Transfer from ${sourceAcc ? sourceAcc.accountName : "Self"}: ${description || ""}`
      });
      await targetLog.save();

      return res.status(201).json(sourceLog);
    }

    // Case B: Standard Deposit or Withdrawal
    const factor = type === "Deposit" ? 1 : -1;
    await BankAccount.findByIdAndUpdate(
      accountId,
      { $inc: { currentBalance: factor * Number(amount) } }
    );

    // If it is a Cash deposit or Cash withdrawal from a regular Bank Account (Bank <-> Galla interlink)
    const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
    const isCashDrawerSelected = cashAcc && String(cashAcc._id) === String(accountId);

    if (method === "Cash" && cashAcc && !isCashDrawerSelected) {
      const cashFactor = type === "Deposit" ? -1 : 1;
      await BankAccount.findByIdAndUpdate(
        cashAcc._id,
        { $inc: { currentBalance: cashFactor * Number(amount) } }
      );

      // Log matching double-entry transaction on CASH-DRAWER passbook!
      const gallaLog = new BankTransaction({
        accountId: cashAcc._id,
        type: type === "Deposit" ? "Withdrawal" : "Deposit",
        method: "Cash",
        amount: Number(amount),
        partyName: type === "Deposit" ? "Deposit to Bank" : "Withdrawal from Bank",
        date: date || new Date().toISOString().split("T")[0],
        description: type === "Deposit" 
          ? `Galla cash deposited to Bank (${description || ""})` 
          : `Cash withdrawn from Bank to Galla (${description || ""})`
      });
      await gallaLog.save();
    }

    // Create primary Transaction log
    const transaction = new BankTransaction({
      accountId,
      type,
      method,
      amount: Number(amount),
      referenceNumber: referenceNumber || "",
      chequeStatus: method === "Cheque" ? "Pending" : "None",
      partyName: partyName || "Self",
      date: date || new Date().toISOString().split("T")[0],
      description: description || ""
    });

    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5. Update Cheque Status (Clear / Bounce Cheque)
router.put("/transactions/:id/cheque", async (req, res) => {
  const { status } = req.body; // 'Cleared', 'Bounced', or 'Pending'
  try {
    const transaction = await BankTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const oldStatus = transaction.chequeStatus;
    if (oldStatus === status) {
      return res.json(transaction);
    }

    transaction.chequeStatus = status;
    await transaction.save();

    // Balance adjustment logic on bounced cheques
    if (status === "Bounced" && oldStatus !== "Bounced") {
      // Reversing balance because cheque bounced
      const factor = transaction.type === "Deposit" ? -1 : 1;
      await BankAccount.findByIdAndUpdate(
        transaction.accountId,
        { $inc: { currentBalance: factor * transaction.amount } }
      );
    } else if (oldStatus === "Bounced" && status !== "Bounced") {
      // Cheque re-validated/restored from Bounced
      const factor = transaction.type === "Deposit" ? 1 : -1;
      await BankAccount.findByIdAndUpdate(
        transaction.accountId,
        { $inc: { currentBalance: factor * transaction.amount } }
      );
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Update a bank account
router.put("/:id", async (req, res) => {
  try {
    const updatedAccount = await BankAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedAccount) {
      return res.status(404).json({ message: "Bank account not found" });
    }
    res.json(updatedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
