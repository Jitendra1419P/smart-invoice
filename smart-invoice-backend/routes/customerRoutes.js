const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new customer
router.post("/", async (req, res) => {
  try {
    if (req.body.totalDue !== undefined && req.body.currentBalance === undefined) {
      req.body.currentBalance = req.body.totalDue;
    } else if (req.body.currentBalance !== undefined && req.body.totalDue === undefined) {
      req.body.totalDue = req.body.currentBalance;
    }
    const newCustomer = new Customer(req.body);
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a customer
router.put("/:id", async (req, res) => {
  try {
    const { paymentMethod, selectedBankId, paidAmount, chequeNumber, customerName, paymentDate } = req.body;
    let targetBankId = selectedBankId;

    if (paymentMethod === "Cash" && paidAmount > 0) {
      const BankAccount = require("../models/BankAccount");
      const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
      if (cashAcc) {
        targetBankId = cashAcc._id;
      }
    }

    if (targetBankId && paidAmount > 0 && (paymentMethod === "Cheque" || paymentMethod === "UPI" || paymentMethod === "Cash")) {
      const BankAccount = require("../models/BankAccount");
      const BankTransaction = require("../models/BankTransaction");

      // 1. Increment Target Bank account by paid amount
      await BankAccount.findOneAndUpdate(
        { _id: targetBankId },
        { $inc: { currentBalance: Number(paidAmount) } }
      );

      // 2. Write deposit transaction ledger log
      const bankLog = new BankTransaction({
        accountId: targetBankId,
        type: "Deposit",
        method: paymentMethod,
        amount: Number(paidAmount),
        referenceNumber: chequeNumber || "",
        chequeStatus: paymentMethod === "Cheque" ? "Pending" : "None",
        partyName: customerName || "Customer",
        date: paymentDate || new Date().toISOString().split("T")[0],
        description: paymentMethod === "Cash" ? `Customer Vasooli (Cash Drawer)` : `Customer Vasooli (Udhaar Collection)`
      });
      await bankLog.save();
    }

    if (req.body.totalDue !== undefined && req.body.currentBalance === undefined) {
      req.body.currentBalance = req.body.totalDue;
    } else if (req.body.currentBalance !== undefined && req.body.totalDue === undefined) {
      req.body.totalDue = req.body.currentBalance;
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a customer
router.delete("/:id", async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
