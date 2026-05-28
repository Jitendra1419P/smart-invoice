const mongoose = require("mongoose");
const Customer = require("./models/Customer");

async function check() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/smart-invoice");
    console.log("Connected to MongoDB.");
    const count = await Customer.countDocuments();
    console.log("Customer Count in MongoDB:", count);
    const list = await Customer.find();
    console.log("Customers:", JSON.stringify(list, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
