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
    // 1. Fallback default customer details to allow shortcuts and instant billing without customer name
    if (!req.body.customerName) {
      req.body.customerName = "Walk-in Customer";
    }

    // Support both 'cart' and 'items' structures in the payload
    if (!req.body.cart && req.body.items && Array.isArray(req.body.items)) {
      req.body.cart = req.body.items.map(item => ({
        id: String(item.productId || item.id || item._id),
        name: item.name || "Product",
        salePrice: Number(item.salePrice || item.price || 0),
        qty: Number(item.qty || 0)
      }));
    } else if (!req.body.items && req.body.cart && Array.isArray(req.body.cart)) {
      req.body.items = req.body.cart.map(item => ({
        productId: String(item.id || item._id),
        name: item.name,
        qty: Number(item.qty)
      }));
    }

    const newInvoice = new Invoice(req.body);
    const savedInvoice = await newInvoice.save();

    // 2. Decrement stock for each item in the normalized cart/items list
    const items = req.body.items || req.body.cart || [];
    for (const item of items) {
      const productId = item.productId || item.id;
      const qty = item.qty || 0;
      if (productId && qty > 0) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: -Number(qty) }
        });
      }
    }

    // 3. INTERLINKING: Automatic banking integration
    const { paymentMode, activeBankId, grandTotal, customerName, date } = req.body;
    const BankAccount = require("../models/BankAccount");
    const BankTransaction = require("../models/BankTransaction");

    if (paymentMode === "Online (UPI)" || paymentMode === "Cheque") {
      // Dukan ka bank account dhoondho (Hum activeBankId ya main business bank account default maan rahe hain)
      let bank = null;
      if (activeBankId) {
        bank = await BankAccount.findById(activeBankId);
      }
      if (!bank) {
        bank = await BankAccount.findOne({ accountNumber: { $ne: "CASH-DRAWER" } });
      }
      if (!bank) {
        bank = await BankAccount.findOne();
      }

      if (bank) {
        // Balance badhao
        bank.currentBalance += Number(grandTotal || 0);
        await bank.save();

        // Bank passbook me entry pass karo
        const bankLog = new BankTransaction({
          accountId: bank._id,
          type: "Deposit",
          method: paymentMode === "Cheque" ? "Cheque" : "UPI",
          amount: Number(grandTotal || 0),
          chequeStatus: paymentMode === "Cheque" ? "Pending" : "None",
          partyName: customerName || "Walk-in Customer",
          date: date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          description: `POS Bill ${savedInvoice.invoiceNumber || req.body.invoiceNumber || ""} Automated Sync`
        });
        await bankLog.save();
      }
    } else if (paymentMode === "Cash") {
      const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
      if (cashAcc) {
        cashAcc.currentBalance += Number(grandTotal || 0);
        await cashAcc.save();

        const bankLog = new BankTransaction({
          accountId: cashAcc._id,
          type: "Deposit",
          method: "Cash",
          amount: Number(grandTotal || 0),
          partyName: customerName || "Walk-in Customer",
          date: date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          description: `POS Cash Sale (SI-${savedInvoice.invoiceNumber || req.body.invoiceNumber || ""})`
        });
        await bankLog.save();
      }
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
