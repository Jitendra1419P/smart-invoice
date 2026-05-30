const express = require("express");
const router = express.Router();
const Supplier = require("../models/Supplier");

// Get all suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new supplier
router.post("/", async (req, res) => {
  try {
    const newSupplier = new Supplier(req.body);
    const savedSupplier = await newSupplier.save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a supplier
router.put("/:id", async (req, res) => {
  try {
    const { paymentMethod, selectedBankId, paidAmount, chequeNumber, supplierName, paymentDate } = req.body;
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

      // 1. Bank account se absolute capital deduct karo
      await BankAccount.findOneAndUpdate(
        { _id: targetBankId },
        { $inc: { currentBalance: -Number(paidAmount) } }
      );

      // 2. Safe withdrawal entry lock karo
      const bankLog = new BankTransaction({
        accountId: targetBankId,
        type: "Withdrawal",
        method: paymentMethod,
        amount: Number(paidAmount),
        referenceNumber: chequeNumber || "",
        chequeStatus: paymentMethod === "Cheque" ? "Pending" : "None",
        partyName: supplierName || "Supplier",
        date: paymentDate || new Date().toISOString().split("T")[0],
        description: paymentMethod === "Cash" ? `Supplier Cash Payment` : `Supplier payment to ${supplierName || "Supplier"}`
      });
      await bankLog.save();
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedSupplier)
      return res.status(404).json({ message: "Supplier not found" });
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a supplier
router.delete("/:id", async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!deletedSupplier)
      return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
