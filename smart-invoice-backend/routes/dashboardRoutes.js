const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const BankAccount = require('../models/BankAccount');

router.get('/summary', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Calculate Today's Sales Volume
    const todayInvoices = await Invoice.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    });
    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // 2. Calculate Total Market Outstanding (Udhaar Vasooli)
    const activeCustomers = await Customer.find();
    const totalReceivables = activeCustomers.reduce((sum, c) => sum + (c.totalDue || c.currentBalance || 0), 0);

    // 3. Fetch Bank Accounts liquidity details (Split Bank vs Cash Drawer)
    const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
    const cashBalance = cashAcc ? cashAcc.currentBalance : 0;

    const mainBank = await BankAccount.findOne({ accountNumber: { $ne: "CASH-DRAWER" } }) || await BankAccount.findOne();
    const bankBalance = mainBank ? mainBank.currentBalance : 0;
    const bankName = mainBank ? mainBank.bankName : "Business Bank";

    // 4. Scan for low stock triggers
    const lowStockItems = await Product.find({ stock: { $lte: 10 } });

    res.status(200).json({
      todaySales,
      totalReceivables,
      bankBalance,
      bankName,
      gallaBalance: cashBalance,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map(p => ({ name: p.name, stock: p.stock }))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
