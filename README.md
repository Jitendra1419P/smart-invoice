# 🧾 SmartInvoice - Dukaan Billing, Khata & Premium Banking App

SmartInvoice is a state-of-the-art, premium full-stack application designed specifically for retail shopkeepers and business owners. It replaces the traditional manual ledger book with a digital, real-time POS terminal, credit book (Udhaar Khata), expense tracker, and unified bank statement ledger.

Equipped with **AI Voice Billing**, a dedicated **Dukaan Cash Drawer (Galla) manager**, and a unified **Khata Transfer system**, this app ensures 100% financial and inventory integrity for retail operations.

---

## 🌟 Key Product Features

### 1. 🛒 POS Billing Terminal & Inventory Enforcement
* **Stock Badge Indicators:** Dynamic badges display stock levels (`Stock: X`, `Low Stock: X`, or `Out of Stock`) inside the billing grid with automatic dims on out-of-stock items.
* **Strict Checkout Limits:** Cart quantities are validated against actual warehouse/shop stock. The system blocks over-checkout and warns: *"Maal stock me nahi hai!"*.
* **Thermal & A4 Invoice Printing:** Generates precise tax receipts (A4 or thermal rolls) calculating CGST, SGST, MRP savings, HSN codes, and self-pickup details dynamically.
* **WhatsApp Share:** Shares structured invoices directly to the customer's mobile number via WhatsApp API with a single click.

### 2. 🎙️ AI Voice Billing & Khata Bot
* **Speech-to-Bill Conversion:** Hands-free billing using web speech recognition. Speak in Hindi/English (e.g., *"Ramesh ko 2 kilo Aashirvaad Atta aur 1 Amul Butter udhaar par de do"*), and the AI automatically matches the customer and loads items into the cart!
* **Khata Bot Assistant:** An interactive AI accountant on the dashboard. Ask about daily sales, outstanding receivables, or expense reports in plain language!

### 3. 👥 Grahak Khata (Customer Credit Ledger)
* **Outstanding Receivable Stats:** Live tracking of outstanding market balance (Udhaar) and credit limit alerts.
* **Dynamic Vasooli Collections:** A detailed collection modal allowing shopkeepers to record payments via Cash, UPI, or Cheque, choosing the target bank account, and writing detailed passbook logs automatically.
* **WhatsApp Reminders:** Sends structured, professional repayment reminders to credit customers on WhatsApp.

### 4. 💰 Business Expenses & Supplier Payments
* **Supplier Book:** Log purchases, track payables, settle dues, and record payment modes.
* **Category Expenses:** Track daily overheads (Rent, Electricity, Chai-Paani, Staff Salary).
* **Double-Entry Financial Reversals:** If a POS invoice, customer payment, or business expense is deleted, the backend automatically reverses the balances in the linked bank/Galla accounts and cleans up the transaction log to maintain absolute integrity.

### 5. 🏛️ Premium Banking, Cheque & CASH IN HAND (Galla) Dashboard
* **Dynamic Cash Drawer (Galla):** Physical drawer cash is tracked as a virtual bank account. POS cash sales and customer cash collections dynamically increment Galla, while cash supplier payments and cash expenses decrement it.
* **Segmented Cash Entry & Transfers Modal:** A single, unified transaction popup at the top of the banking screen allowing:
  * **Jama (Deposit):** Cash direct additions or capital investments into Galla or Bank.
  * **Nikalein (Withdrawal):** Cash withdrawals or drawings from Bank or Galla.
  * **Khata Transfer (Transfer):** Seamlessly transfer funds between Bank Accounts or Bank <-> Galla, automatically logging double-entry passbook statements on both sides!
* **Active Bank Cards:** Floating, interactive HDFC/SBI bank cards with real-time balances, IFSC, and account numbers.
* **Details Editor:** Click the floating Edit (pencil) button on any bank card or the CASH IN HAND card to adjust account details or set the opening cash balance directly.
* **Cheque Pipeline Tracker:** Keep track of pending cheques received or issued. Clear or bounce cheques manually with automatic balance restorations.

### 6. 🔄 Automatic Self-Healing Sync Engine
* **Retroactive Reconciliation:** Backend startup migration that scans MongoDB for historical cash invoices or expenses (e.g., created before Galla account was seeded) and automatically retro-syncs them. It updates cash balances and generates all missing passbook statements on startup.

---

## 🛠️ Technology Stack
* **Frontend:** React, Vite, TailwindCSS (curated premium HSL dark/light modes), Lucide Icons.
* **Backend:** Node.js, Express.js (REST APIs, CORS).
* **Database:** MongoDB (local fallback support or Atlas Cloud).
* **State Management:** Zustand (for centralized settings, languages, business details).

---

## ⚙️ Project Folder Structure
```text
smart-invoice/
│
├── smart-invoice-app/          # Frontend React Application
│   ├── src/
│   │   ├── api/                # Axios Client & Backend API mappings
│   │   ├── pages/              # POS, Customers, BankingDashboard, etc.
│   │   ├── store/              # Zustand settings store
│   │   └── data/               # Static translations & mock data
│   └── package.json
│
├── smart-invoice-backend/      # Backend API Server
│   ├── config/                 # db.js (database connection & self-healing sync)
│   ├── models/                 # Mongoose schemas (Invoice, BankAccount, Transaction, etc.)
│   ├── routes/                 # API Routes (invoiceRoutes, bankRoutes, customerRoutes)
│   ├── server.js               # Entry point (Port: 5000)
│   └── package.json
│
└── README.md                   # Project Documentation
```

---

## 🚀 Installation & Local Setup

### Prerequisites
1. Install **Node.js** (v18 or higher recommended).
2. Install **MongoDB** locally (starts on `mongodb://127.0.0.1:27017/`) or prepare a MongoDB Atlas connection string.

---

### Step 1: Run the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd smart-invoice-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Prepare the Environment Variables:
   Create a `.env` file inside `smart-invoice-backend` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart-invoice
   ```
4. Run in Development Mode (Nodemon hot-reload):
   ```bash
   npm run dev
   ```
   *The console will log:* `🚀 SmartInvoice Backend is running on port 5000` & `✅ Seeded Cash Drawer account successfully!`.

---

### Step 2: Run the Frontend App
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd smart-invoice-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser:
   * **URL:** [http://localhost:5173/](http://localhost:5173/)

---

## 🤝 Branch Management & Collaboration

All new updates and features related to premium financial audits, Galla integrations, and Khata Transfers are tracked inside our dedicated feature branch:

* **Feature Branch:** `feature/premium-banking-audit`
* **Pull Request Link:** [Create Pull Request on GitHub](https://github.com/Jitendra1419P/smart-invoice/pull/new/feature/premium-banking-audit)

---

## 📝 License
This project is licensed under the MIT License. Developed with absolute precision to support premium business invoicing.
