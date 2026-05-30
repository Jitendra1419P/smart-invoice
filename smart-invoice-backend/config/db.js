const mongoose = require("mongoose");

const defaultLocalMongo = "mongodb://127.0.0.1:27017/smart-invoice";
const configuredUri = process.env.MONGO_URI?.trim();
let useLocalFallback = !configuredUri;

const connectDB = async () => {
  const mongoUri = useLocalFallback ? defaultLocalMongo : configuredUri;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Seed default bank accounts
    try {
      const BankAccount = require("../models/BankAccount");
      const bankCount = await BankAccount.countDocuments();
      if (bankCount === 0) {
        await BankAccount.create([
          {
            accountName: "HDFC Current A/c",
            bankName: "HDFC Bank",
            accountNumber: "50200012345678",
            ifscCode: "HDFC0000001",
            currentBalance: 482500,
          },
          {
            accountName: "SBI Business A/c",
            bankName: "State Bank of India",
            accountNumber: "30999888777",
            ifscCode: "SBIN0001234",
            currentBalance: 125000,
          },
          {
            accountName: "Cash in Hand (Galla)",
            bankName: "Cash Drawer",
            accountNumber: "CASH-DRAWER",
            ifscCode: "CASH0000000",
            currentBalance: 15000,
          },
        ]);
        console.log("✅ Seeded default bank accounts successfully!");
      } else {
        const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
        if (!cashAcc) {
          await BankAccount.create({
            accountName: "Cash in Hand (Galla)",
            bankName: "Cash Drawer",
            accountNumber: "CASH-DRAWER",
            ifscCode: "CASH0000000",
            currentBalance: 15000,
          });
          console.log("✅ Seeded Cash Drawer account successfully!");
        }
      }

      // Run automatic self-healing sync for past un-synced transactions
      await syncPastTransactions();
    } catch (seedError) {
      console.error("❌ Failed to seed default bank accounts:", seedError.message);
    }
  } catch (error) {
    console.error(
      `❌ Error connecting to MongoDB (${mongoUri}): ${error.message}`,
    );

    if (!configuredUri) {
      console.warn(
        "⚠️ No MONGO_URI configured. Please install MongoDB locally or set MONGO_URI in .env.",
      );
    } else if (!useLocalFallback) {
      console.warn(
        "⚠️ Could not connect to the configured MongoDB Atlas URI. Falling back to local MongoDB at mongodb://127.0.0.1:27017/smart-invoice.",
      );
      useLocalFallback = true;
    } else {
      console.warn(
        "⚠️ Still unable to connect to local MongoDB. Install MongoDB locally or update MONGO_URI in .env.",
      );
    }

    console.log(
      "⚠️ Server is running, but database features will be unavailable until MongoDB connects.",
    );
    setTimeout(connectDB, 5000);
  }
};

const syncPastTransactions = async () => {
  try {
    const BankAccount = require("../models/BankAccount");
    const BankTransaction = require("../models/BankTransaction");
    const Invoice = require("../models/Invoice");
    const Expense = require("../models/Expense");

    console.log("🔄 Starting automatic banking self-healing sync...");

    // Find CASH-DRAWER account
    const cashAcc = await BankAccount.findOne({ accountNumber: "CASH-DRAWER" });
    if (!cashAcc) {
      console.warn("⚠️ CASH-DRAWER account not found. Skipping auto-sync.");
      return;
    }

    // 1. Sync Invoices
    const invoices = await Invoice.find();
    let invoicesSynced = 0;
    for (const invoice of invoices) {
      const { paymentMode, activeBankId, grandTotal, customerName, date, invoiceNumber } = invoice;
      
      // Determine target bank
      let targetBankId = activeBankId;
      if (paymentMode === "Cash") {
        targetBankId = cashAcc._id;
      }

      if (!targetBankId && (paymentMode === "Online (UPI)" || paymentMode === "Cheque" || paymentMode === "Cash")) {
        if (paymentMode === "Cash") {
          targetBankId = cashAcc._id;
        } else {
          const firstBank = await BankAccount.findOne({ accountNumber: { $ne: "CASH-DRAWER" } });
          if (firstBank) targetBankId = firstBank._id;
        }
      }

      if (targetBankId && (paymentMode === "Online (UPI)" || paymentMode === "Cheque" || paymentMode === "Cash")) {
        // Check if there is already a transaction matching this invoice number
        const matchRegex = new RegExp(invoiceNumber, "i");
        const existingTxn = await BankTransaction.findOne({
          accountId: targetBankId,
          description: { $regex: matchRegex }
        });

        if (!existingTxn) {
          console.log(`⚡ Retro-syncing missing Invoice transaction: ${invoiceNumber} (${paymentMode}) of Amount ₹${grandTotal}`);
          
          // 1. Increment Target Bank account by grand total
          await BankAccount.findOneAndUpdate(
            { _id: targetBankId },
            { $inc: { currentBalance: Number(grandTotal) } }
          );

          // 2. Create Bank Transaction log
          const bankLog = new BankTransaction({
            accountId: targetBankId,
            type: "Deposit",
            method: paymentMode === "Cash" ? "Cash" : (paymentMode === "Cheque" ? "Cheque" : "UPI"),
            amount: Number(grandTotal),
            chequeStatus: paymentMode === "Cheque" ? "Pending" : "None",
            partyName: customerName || "One-Time Customer",
            date: date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            description: paymentMode === "Cash" ? `POS Cash Sale (SI-${invoiceNumber})` : `POS Bill ${invoiceNumber}`
          });
          await bankLog.save();
          invoicesSynced++;
        }
      }
    }

    // 2. Sync Expenses
    const expenses = await Expense.find();
    let expensesSynced = 0;
    for (const expense of expenses) {
      const { category, amount, description, paymentMethod, selectedBankId, date } = expense;

      let targetBankId = selectedBankId;
      if (paymentMethod === "Cash") {
        targetBankId = cashAcc._id;
      }

      if (!targetBankId && (paymentMethod === "Cheque" || paymentMethod === "UPI" || paymentMethod === "Cash")) {
        if (paymentMethod === "Cash") {
          targetBankId = cashAcc._id;
        } else {
          const firstBank = await BankAccount.findOne({ accountNumber: { $ne: "CASH-DRAWER" } });
          if (firstBank) targetBankId = firstBank._id;
        }
      }

      if (targetBankId && amount > 0 && (paymentMethod === "Cheque" || paymentMethod === "UPI" || paymentMethod === "Cash")) {
        // Check if there is already a transaction matching this expense category/description
        const matchDesc = `Expense: ${category} - ${description || ""}`;
        const existingTxn = await BankTransaction.findOne({
          accountId: targetBankId,
          type: "Withdrawal",
          amount: Number(amount),
          $or: [
            { description: matchDesc },
            { description: { $regex: new RegExp(category, "i") } }
          ]
        });

        if (!existingTxn) {
          console.log(`⚡ Retro-syncing missing Expense transaction of Amount ₹${amount} (${category})`);

          // 1. Decrement Bank account balance
          await BankAccount.findOneAndUpdate(
            { _id: targetBankId },
            { $inc: { currentBalance: -Number(amount) } }
          );

          // 2. Create Bank Transaction log
          const bankLog = new BankTransaction({
            accountId: targetBankId,
            type: "Withdrawal",
            method: paymentMethod,
            amount: Number(amount),
            chequeStatus: paymentMethod === "Cheque" ? "Pending" : "None",
            partyName: description || category || "Expense",
            date: date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            description: matchDesc
          });
          await bankLog.save();
          expensesSynced++;
        }
      }
    }

    console.log(`✅ Self-healing sync finished: Synced ${invoicesSynced} Invoices, ${expensesSynced} Expenses.`);
  } catch (error) {
    console.error("❌ Failed to run self-healing transaction sync:", error.message);
  }
};

module.exports = connectDB;
