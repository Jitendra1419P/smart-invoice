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

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
