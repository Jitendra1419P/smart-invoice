const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// Get all invoices
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new invoice
router.post("/", async (req, res) => {
  try {
    const newInvoice = new Invoice(req.body);
    const savedInvoice = await newInvoice.save();

    // Decrement stock for each item in the cart
    if (req.body.cart && Array.isArray(req.body.cart)) {
      for (const item of req.body.cart) {
        if (item.id) {
          await Product.findByIdAndUpdate(
            item.id,
            { $inc: { stock: -Number(item.qty) } }
          );
        }
      }
    }

    // Automatic banking integration
    const { paymentMode, activeBankId, grandTotal, customerName, date } = req.body;
    const BankAccount = require("../models/BankAccount");
    const BankTransaction = require("../models/BankTransaction");
    let targetBankId = activeBankId;

    if (paymentMode === "Cash") {
      const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
      if (cashAcc) {
        targetBankId = cashAcc._id;
      }
    }

    if (targetBankId && (paymentMode === "Online (UPI)" || paymentMode === "Cheque" || paymentMode === "Cash")) {
      // 1. Increment Target Bank account by grand total
      await BankAccount.findOneAndUpdate(
        { _id: targetBankId },
        { $inc: { currentBalance: Number(grandTotal) } }
      );

      // 2. Automated Bank Transaction log add karo
      const bankLog = new BankTransaction({
        accountId: targetBankId,
        type: "Deposit",
        method: paymentMode === "Cash" ? "Cash" : (paymentMode === "Cheque" ? "Cheque" : "UPI"),
        amount: Number(grandTotal),
        chequeStatus: paymentMode === "Cheque" ? "Pending" : "None",
        partyName: customerName || "One-Time Customer",
        date: date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        description: paymentMode === "Cash" ? `POS Cash Sale (SI-${savedInvoice.invoiceNumber})` : `POS Bill ${savedInvoice.invoiceNumber || ""}`
      });
      await bankLog.save();
    }

    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an invoice
router.delete("/:id", async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice)
      return res.status(404).json({ message: "Invoice not found" });

    // 1. Restock products in inventory dynamically
    if (deletedInvoice.cart && Array.isArray(deletedInvoice.cart)) {
      for (const item of deletedInvoice.cart) {
        if (item.id) {
          await Product.findByIdAndUpdate(
            item.id,
            { $inc: { stock: Number(item.qty) } }
          );
        }
      }
    }

    // 2. Decrement customer totalDue balance dynamically
    if (deletedInvoice.customerName && deletedInvoice.customerName !== "One-Time Customer") {
      const customer = await Customer.findOne({
        $or: [
          { name: deletedInvoice.customerName },
          { phone: deletedInvoice.customerPhone }
        ]
      });
      if (customer) {
        customer.totalDue = Math.max(0, (customer.totalDue ?? 0) - deletedInvoice.grandTotal);
        await customer.save();
      }
    }

    // 3. Bank rollback integration
    let rollbackBankId = deletedInvoice.activeBankId;
    if (deletedInvoice.paymentMode === "Cash") {
      const BankAccount = require("../models/BankAccount");
      const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
      if (cashAcc) {
        rollbackBankId = cashAcc._id;
      }
    }

    if (rollbackBankId && (deletedInvoice.paymentMode === "Online (UPI)" || deletedInvoice.paymentMode === "Cheque" || deletedInvoice.paymentMode === "Cash")) {
      const BankAccount = require("../models/BankAccount");
      const BankTransaction = require("../models/BankTransaction");

      // Decrement target Bank balance back by the invoice amount (reversing deposit)
      await BankAccount.findOneAndUpdate(
        { _id: rollbackBankId },
        { $inc: { currentBalance: -Number(deletedInvoice.grandTotal) } }
      );

      // Remove matching transaction ledger log
      await BankTransaction.findOneAndDelete({
        accountId: rollbackBankId,
        type: "Deposit",
        method: deletedInvoice.paymentMode === "Cash" ? "Cash" : (deletedInvoice.paymentMode === "Cheque" ? "Cheque" : "UPI"),
        amount: Number(deletedInvoice.grandTotal),
        partyName: deletedInvoice.customerName || "One-Time Customer"
      });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
