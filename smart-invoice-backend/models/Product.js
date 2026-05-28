const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    weight: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
