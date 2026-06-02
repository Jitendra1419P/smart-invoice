const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customerName: { type: String, default: "Walk-in Customer" },
    customerPhone: { type: String },
    cart: [
      {
        id: { type: String },
        name: { type: String, required: true },
        salePrice: { type: Number, required: true },
        qty: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMode: { type: String, default: "Cash" },
    activeBankId: { type: String },
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
