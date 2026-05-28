// 1. Dashboard Stats Data
export const initialDashboardStats = {
  totalSale: 12500,
  netProfit: 3200,
  receivables: 15500, // Lena Hai (Outstanding)
  payables: 8200, // Dena Hai (Payables)
};

// 2. Products Inventory Data
export const initialProducts = [
  {
    id: 1,
    name: "Aashirvaad Atta 5kg",
    supplier: "Ramesh Distributors",
    salePrice: 210,
    purchasePrice: 190,
    stock: 5,
    minStock: 10,
  },
  {
    id: 2,
    name: "Tata Salt 1kg",
    supplier: "Ramesh Distributors",
    salePrice: 24,
    purchasePrice: 20,
    stock: 15,
    minStock: 10,
  },
  {
    id: 3,
    name: "Maggi 2-Min Noodles",
    supplier: "Gupta Traders",
    salePrice: 14,
    purchasePrice: 11,
    stock: 100,
    minStock: 20,
  },
  {
    id: 4,
    name: "Amul Butter 100g",
    supplier: "Sharma Dairy Agency",
    salePrice: 56,
    purchasePrice: 48,
    stock: 25,
    minStock: 10,
  },
  {
    id: 5,
    name: "Fortune Sunflower Oil 1L",
    supplier: "Gupta Traders",
    salePrice: 145,
    purchasePrice: 130,
    stock: 2,
    minStock: 5,
  },
  {
    id: 6,
    name: "Parle-G Biscuit",
    supplier: "Gupta Traders",
    salePrice: 10,
    purchasePrice: 8,
    stock: 22,
    minStock: 15,
  },
];

// 3. Customers Khata Data
export const initialCustomers = [
  {
    id: 1,
    name: "Amit Sharma",
    phone: "9876543210",
    balance: 4500,
    creditLimit: 5000,
    lastPaid: "12 May 2026",
  },
  {
    id: 2,
    name: "Sunil Verma",
    phone: "9123456789",
    balance: 1200,
    creditLimit: 3000,
    lastPaid: "20 May 2026",
  },
  {
    id: 3,
    name: "Rajesh Gupta",
    phone: "8877665544",
    balance: 0,
    creditLimit: 5000,
    lastPaid: "Today",
  },
  {
    id: 4,
    name: "Vikram Singh",
    phone: "7766554433",
    balance: 9800,
    creditLimit: 8000,
    lastPaid: "01 Apr 2026",
  },
];

// 4. Suppliers Data
export const initialSuppliers = [
  {
    id: 1,
    name: "Ramesh Kumar",
    company: "Ramesh Distributors",
    phone: "9876543210",
    payable: 8200,
  },
  {
    id: 2,
    name: "Sanjay Gupta",
    company: "Gupta Traders",
    phone: "9123456789",
    payable: 0,
  },
  {
    id: 3,
    name: "Alok Sharma",
    company: "Sharma Dairy Agency",
    phone: "8877665544",
    payable: 15400,
  },
];

// 5. Suppliers Linked Products List
export const initialSupplierProducts = {
  "Ramesh Distributors": [
    { name: "Aashirvaad Atta 5kg", stock: 5, minStock: 10, price: 190 },
    { name: "Tata Salt 1kg", stock: 15, minStock: 10, price: 20 },
  ],
  "Gupta Traders": [
    { name: "Maggi 2-Min Noodles", stock: 100, minStock: 20, price: 11 },
    { name: "Fortune Sunflower Oil 1L", stock: 2, minStock: 5, price: 130 },
    { name: "Parle-G Biscuit", stock: 22, minStock: 15, price: 8 },
  ],
  "Sharma Dairy Agency": [
    { name: "Amul Butter 100g", stock: 25, minStock: 10, price: 48 },
  ],
};

// 6. Expenses Data (Sirf EK baar declared hai ab!)
export const initialExpenses = [
  {
    id: 1,
    title: "Dukaan ka Kiraya (Rent)",
    amount: 12000,
    category: "Rent & Bills",
    date: "2026-05-01",
  },
  {
    id: 2,
    title: "Bijli ka Bill (Electricity)",
    amount: 3450,
    category: "Rent & Bills",
    date: "2026-05-10",
  },
  {
    id: 3,
    title: "Chai aur Biscuit (Grahak/Staff)",
    amount: 450,
    category: "Chai-Paani",
    date: "2026-05-24",
  },
  {
    id: 4,
    title: "Chhotu ki Salary",
    amount: 8000,
    category: "Staff Salary",
    date: "2026-05-05",
  },
  {
    id: 5,
    title: "Naye Plastic Bags",
    amount: 600,
    category: "Others",
    date: "2026-05-18",
  },
];
