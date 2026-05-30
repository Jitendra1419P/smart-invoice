const mongoose = require("mongoose");
const BankAccount = require("./models/BankAccount");
const BankTransaction = require("./models/BankTransaction");
const Invoice = require("./models/Invoice");

async function check() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/smart-invoice");
    console.log("Connected to MongoDB.");
    
    const accounts = await BankAccount.find();
    console.log("--- BANK ACCOUNTS ---");
    console.log(JSON.stringify(accounts, null, 2));

    const invoiceCount = await Invoice.countDocuments();
    console.log("\n--- TOTAL INVOICES ---", invoiceCount);
    const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(5);
    console.log(JSON.stringify(invoices.map(i => ({
      invoiceNumber: i.invoiceNumber,
      customerName: i.customerName,
      grandTotal: i.grandTotal,
      paymentMode: i.paymentMode,
      activeBankId: i.activeBankId,
      createdAt: i.createdAt
    })), null, 2));

    const transactions = await BankTransaction.find().sort({ createdAt: -1 }).limit(10);
    console.log("\n--- RECENT BANK TRANSACTIONS ---");
    console.log(JSON.stringify(transactions, null, 2));

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
