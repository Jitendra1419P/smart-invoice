# 🧾 SmartInvoice - Real-Time Retail ERP & Ledger Book

SmartInvoice ek premium, production-ready Full-Stack MERN billing and inventory control application hai jo retail merchants ko unke business operations streamline karne me madad karta hai. Isme digital bookkeeping, real-time analytics dashboards, automated testing engines aur intuitive credit (udhaar) limits animations integrated hain.

---

## 🚀 Key Modules & Architecture

SmartInvoice ka complete system **6 Core UI Architecture Pillars** par structured hai:

*   **📊 Dashboard & Business Analytics:** 
    *   Monthly business revenue, asset turnover metrics aur structural cash vs online transaction logs.
    *   Low stock threshold level markers aur direct operational WhatsApp alert automation handles.
*   **🧾 Real-Time POS (Point of Sale Engine):** 
    *   Interactive client-side catalog search with transactional quantity adjusters.
    *   Strict localized auto-computations for dynamically scalable flat taxes, product group margins, and user-defined absolute discounts.
*   **📦 Inventory Control Center (Products):** 
    *   Dynamic multi-supplier storage data arrays with visual capacity level state-indicators (Low/Medium/Full).
    *   Asynchronous CRUD modals coupled to cloud-side schema architectures.
*   **👥 Customer Digital Ledger (Grahak Khata):** 
    *   Active merchant tracking systems managing absolute client udhaar receivables.
    *   High-risk notification layers containing sequential UI alerts on absolute credit-limit exhaustion (`OVER LIMIT` critical notifications).
*   **🚚 Supplier Supply-Chain Hub:** 
    *   Advanced procurement logic containing custom "+ Maal Entry" templates.
    *   Submitting item restocks executes synchronized increments inside the inventory databases while automatically evaluating live enterprise liability tallies.
*   **📜 Invoice Transactional History Logs:** 
    *   Top analytics matrix containing aggregated sales parameters across distinct payment gateways (Cash, UPI, Credit).
    *   Filterable tabular history records with explicit granular data extraction.
*   **⚙️ Global Core Configuration Workspace:**
    *   Universal state parameters managed via Zustand stores tracking active UX styles.
    *   Interactive primary theme palette selectors (Sapphire Blue, Emerald Green, Royal Purple, Crimson Rose).
    *   Advanced Label drop-zones replacing traditional buttons with an organic clickable bounding wrapper for digital brand asset processing.

---

## 🛠️ Technological Blueprints & State Pipelines

### Core Technological Stack
*   **Frontend System Tier:** React.js framework deployed using Vite environments, optimized via Tailwind CSS layout grids, and augmented with lightweight Lucide-react iconography sets.
*   **State Management Engine:** Zustand store architectures configured with state serialization structures (`persist` middleware modules). Choices like Theme Modes (Light/Dark paradigms) stay permanently cached across local browser memory stores.
*   **Data Serialization Engine:** Node.js with Express servers linked directly onto a MongoDB Atlas multi-cluster server.
*   **Automation Assurance Tier:** Playwright End-to-End browser engine suites running real-time headless validation routines.

### Client-Side State Schemas (`src/data/mockData.js`)
All structural templates are centralized to preserve operational design rules:
*   `initialDashboardStats`: Aggregates active receivables, liquid expenditure balances, and threshold inventory units.
*   `initialProducts` / `initialCustomers` / `initialSuppliers`: Controls system state parameters tracking baseline business resources.
*   `initialExpenses`: Tracks systematic capital deployment frequencies.

---

## 📦 System Installation & Deployment Playbook

### Prerequisites
Ensure your local terminal contains Node.js runtimes (v18+) and access to an isolated MongoDB cluster string.

### Directory Mapping
```text
smart-invoice/
├── smart-invoice-backend/   # Express Core API Services
└── src/                     # React Client Interfaces

```

# ⚙️ SmartInvoice - Backend API Server Engine

SmartInvoice Application ka yeh core backend server repository hai. Yeh ek highly scalable RESTful API engine hai jise Node.js, Express.js, aur Mongoose (MongoDB ODM) ka use karke design kiya gaya hai. Yeh cloud database integration, analytical computations, aur secure data serialization handle karta hai.

---

## 🏗️ Architectural Overview & API Gateway

Yeh server frontend templates se incoming request traffic handle karta hai aur client endpoints ko niche diye gaye models ke sath synchronize rakhta hai:

* **📦 `/api/products`** -> Inventory stocks, purchase/sale pricing structures, and low-threshold automated alerts.
* **👥 `/api/customers`** -> Digital credit khata bookkeeping and dynamic absolute credit-limit violation handlers.
* **🚚 `/api/suppliers`** -> Procurement logging sheets and dynamic merchant liability calculators.
* **💸 `/api/expenses`** -> Daily operational expense parameters mapped by date-frequencies.
* **📜 `/api/invoices`** -> Billing generation archives, historical sales matrix, and transactional payment modes split logic.

---

## 🛠️ Tech Stack & Dependencies
* **Runtime Environment:** Node.js (v18+ recommended)
* **Backend Framework:** Express.js (HTTP routing pipelines)
* **Database Management:** MongoDB Atlas (Cloud Clusters)
* **Object Data Modeling (ODM):** Mongoose
* **Cross-Origin Resource Sharing:** CORS Node Middleware
* **Process Manager (Dev Mode):** Nodemon (Auto-restarts server on file edits)

---

## 🚀 Cloud Deployment Playbook (Step-by-Step)

### 1. Preparing the Code for Production
Deployment par bhejne se pehle ensure karein ki aapka `package.json` file completely functional hai aur usme standard start run-scripts appended hain:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```
