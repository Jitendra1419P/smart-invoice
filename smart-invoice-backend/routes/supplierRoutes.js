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

// 🚀 AUTOMATED MAAL ENTRY & STOCK INCREMENT ENGINE
router.post('/procure', async (req, res) => {
  const { supplierId, productId, quantity, totalCost, isPaid } = req.body;

  try {
    const Product = require("../models/Product");
    const Supplier = require("../models/Supplier");

    // Action A: Inventory me target product ka stock badhao (+ inc)
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: Number(quantity) } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Bhai yeh product inventory me nahi mila!" });
    }

    // Action B: Supplier ke ledger me total payable balance badhao (Agar udhaar par maal aaya hai)
    // Agar turant cash paid kar diya, toh liability 0 badhegi, varna total cost jodd di jayegi
    const liabilityDelta = isPaid ? 0 : Number(totalCost);

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      { $inc: { totalPayable: liabilityDelta } },
      { new: true }
    );

    res.status(200).json({
      message: "⚡ Maal Entry Successful! Stock and Ledger updated concurrently.",
      product: updatedProduct,
      supplier: updatedSupplier
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
