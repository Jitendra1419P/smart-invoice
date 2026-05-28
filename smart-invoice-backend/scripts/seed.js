require("dotenv").config();
const connectDB = require("../config/db");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");

const suppliersData = [
  {
    name: "Ramesh Distributors",
    phone: "9876543210",
    address: "",
    totalPayable: 8200,
  },
  { name: "Gupta Traders", phone: "9123456789", address: "", totalPayable: 0 },
  {
    name: "Sharma Dairy Agency",
    phone: "8877665544",
    address: "",
    totalPayable: 15400,
  },
];

const productsData = [
  {
    name: "Aashirvaad Atta 5kg",
    price: 210,
    salePrice: 210,
    stock: 5,
    supplierName: "Ramesh Distributors",
  },
  {
    name: "Tata Salt 1kg",
    price: 24,
    salePrice: 24,
    stock: 15,
    supplierName: "Ramesh Distributors",
  },
  {
    name: "Maggi 2-Min Noodles",
    price: 14,
    salePrice: 14,
    stock: 100,
    supplierName: "Gupta Traders",
  },
  {
    name: "Amul Butter 100g",
    price: 56,
    salePrice: 56,
    stock: 25,
    supplierName: "Sharma Dairy Agency",
  },
  {
    name: "Fortune Sunflower Oil 1L",
    price: 145,
    salePrice: 145,
    stock: 2,
    supplierName: "Gupta Traders",
  },
  {
    name: "Parle-G Biscuit",
    price: 10,
    salePrice: 10,
    stock: 22,
    supplierName: "Gupta Traders",
  },
];

const customersData = [
  {
    name: "Amit Sharma",
    phone: "9876543210",
    creditLimit: 5000,
    totalDue: 4500,
  },
  {
    name: "Sunil Verma",
    phone: "9123456789",
    creditLimit: 3000,
    totalDue: 1200,
  },
  { name: "Rajesh Gupta", phone: "8877665544", creditLimit: 5000, totalDue: 0 },
  {
    name: "Vikram Singh",
    phone: "7766554433",
    creditLimit: 8000,
    totalDue: 9800,
  },
];

const expensesData = [
  {
    category: "Rent & Bills",
    amount: 12000,
    description: "Dukaan ka Kiraya (Rent)",
    date: new Date("2026-05-01"),
  },
  {
    category: "Rent & Bills",
    amount: 3450,
    description: "Bijli ka Bill (Electricity)",
    date: new Date("2026-05-10"),
  },
  {
    category: "Chai-Paani",
    amount: 450,
    description: "Chai aur Biscuit (Grahak/Staff)",
    date: new Date("2026-05-24"),
  },
  {
    category: "Staff Salary",
    amount: 8000,
    description: "Chhotu ki Salary",
    date: new Date("2026-05-05"),
  },
  {
    category: "Others",
    amount: 600,
    description: "Naye Plastic Bags",
    date: new Date("2026-05-18"),
  },
];

async function seed() {
  try {
    await connectDB();

    console.log(
      "Clearing existing collections (products, suppliers, customers, expenses)...",
    );
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await Customer.deleteMany({});
    await Expense.deleteMany({});

    console.log("Inserting suppliers...");
    const insertedSuppliers = await Supplier.insertMany(suppliersData);

    const supplierMap = insertedSuppliers.reduce((acc, s) => {
      acc[s.name] = s._id;
      return acc;
    }, {});

    console.log("Inserting products...");
    const productsToInsert = productsData.map((p) => ({
      name: p.name,
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      supplierId: supplierMap[p.supplierName] || null,
    }));
    await Product.insertMany(productsToInsert);

    console.log("Inserting customers...");
    await Customer.insertMany(customersData);

    console.log("Inserting expenses...");
    await Expense.insertMany(expensesData);

    console.log("✅ Seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
