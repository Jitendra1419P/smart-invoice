import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSettingsStore from "../store/settingsStore";
// Centralized Mock Data Import
import { initialDashboardStats, initialProducts } from "../data/mockData";
import * as api from "../api";

import {
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Flame,
  Snowflake,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  FilePlus,
  PackagePlus,
  Wallet,
  ShoppingBag,
  HandCoins,
  MessageCircle,
} from "lucide-react";

const Dashboard = () => {
  const { themeMode, primaryColor } = useSettingsStore();
  const navigate = useNavigate();
  const [profitFilter, setProfitFilter] = useState("Today");
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [stats, setStats] = useState({
    totalSale: 0,
    netProfit: 0,
    receivables: 0,
    payables: 0,
  });

  // Load products, stats, invoices, and expenses from backend dynamically!
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getProducts();
        if (!mounted) return;
        const mapped = data.map((p) => ({
          id: p._id || p.id,
          name: p.name,
          supplier: p.supplierId?.name || "Unknown",
          salePrice: p.salePrice ?? p.price ?? 0,
          purchasePrice: p.price ?? p.salePrice ?? 0,
          stock: p.stock ?? 0,
          minStock: p.minStock ?? 10,
        }));
        setProducts(mapped);
      } catch (err) {
        setProducts(initialProducts);
      }
    })();

    (async () => {
      try {
        const [customersData, suppliersData, invoicesData, expensesData] = await Promise.all([
          api.getCustomers(),
          api.getSuppliers(),
          api.getInvoices(),
          api.getExpenses(),
        ]);
        if (!mounted) return;

        setInvoices(invoicesData);
        setExpenses(expensesData);
        
        const receivables = customersData.reduce((sum, c) => sum + (c.totalDue ?? 0), 0);
        const payables = suppliersData.reduce((sum, s) => sum + (s.totalPayable ?? 0), 0);
        
        setStats(prev => ({
          ...prev,
          receivables,
          payables,
        }));
      } catch (err) {
        console.error("Failed to load dashboard stats from API", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Dynamically compute Sales and Net Profit based on timeframes!
  useEffect(() => {
    const isDateInFilter = (dateStr, filter) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (filter === "Today") {
        return d >= startOfToday;
      } else if (filter === "This Week") {
        const day = now.getDay();
        const startOfWeek = new Date(startOfToday.getTime() - day * 24 * 60 * 60 * 1000);
        return d >= startOfWeek;
      } else if (filter === "This Month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= startOfMonth;
      }
      return true;
    };

    const filteredInvoices = invoices.filter((inv) =>
      isDateInFilter(inv.date || inv.createdAt, profitFilter)
    );
    const filteredExpenses = expenses.filter((exp) =>
      isDateInFilter(exp.date || exp.createdAt, profitFilter)
    );

    const totalSale = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalExpense = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Net profit = Total Sales - Total Expenses
    const netProfit = totalSale - totalExpense;

    setStats((prev) => ({
      ...prev,
      totalSale,
      netProfit,
    }));
  }, [invoices, expenses, profitFilter]);

  // General Colors
  const bgMain =
    themeMode === "dark"
      ? "bg-gray-900 text-white"
      : "bg-gray-50 text-gray-900";
  const cardBg =
    themeMode === "dark"
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200";
  const textMuted = themeMode === "dark" ? "text-gray-400" : "text-gray-500";

  // Base card class
  const actionCardBase = `p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
    themeMode === "dark"
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-100"
  }`;

  const themeStyles = {
    blue: {
      cardHover:
        themeMode === "dark"
          ? "hover:border-blue-500 hover:bg-blue-900/30"
          : "hover:border-blue-500 hover:bg-blue-50",
      iconBox:
        themeMode === "dark"
          ? "bg-blue-900/40 text-blue-400"
          : "bg-blue-100 text-blue-600",
    },
    green: {
      cardHover:
        themeMode === "dark"
          ? "hover:border-green-500 hover:bg-green-900/30"
          : "hover:border-green-500 hover:bg-green-50",
      iconBox:
        themeMode === "dark"
          ? "bg-green-900/40 text-green-400"
          : "bg-green-100 text-green-600",
    },
    purple: {
      cardHover:
        themeMode === "dark"
          ? "hover:border-purple-500 hover:bg-purple-900/30"
          : "hover:border-purple-500 hover:bg-purple-50",
      iconBox:
        themeMode === "dark"
          ? "bg-purple-900/40 text-purple-400"
          : "bg-purple-100 text-purple-600",
    },
    rose: {
      cardHover:
        themeMode === "dark"
          ? "hover:border-rose-500 hover:bg-rose-900/30"
          : "hover:border-rose-500 hover:bg-rose-50",
      iconBox:
        themeMode === "dark"
          ? "bg-rose-900/40 text-rose-400"
          : "bg-rose-100 text-rose-600",
    },
  };

  const activeStyle = themeStyles[primaryColor] || themeStyles.blue;

  const expenseStyle = {
    cardHover:
      themeMode === "dark"
        ? "hover:border-red-500 hover:bg-red-900/30"
        : "hover:border-red-500 hover:bg-red-50",
    iconBox:
      themeMode === "dark"
        ? "bg-red-900/40 text-red-400"
        : "bg-red-100 text-red-600",
  };

  const paymentStyle = {
    cardHover:
      themeMode === "dark"
        ? "hover:border-emerald-500 hover:bg-emerald-900/30"
        : "hover:border-emerald-500 hover:bg-emerald-50",
    iconBox:
      themeMode === "dark"
        ? "bg-emerald-900/40 text-emerald-400"
        : "bg-emerald-100 text-emerald-600",
  };

  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  const deadStock = [
    { name: "Premium Green Tea", days: 45, stock: 20 },
    { name: "Exotic Dark Chocolate", days: 60, stock: 15 },
  ];
  return (
    <div className={`min-h-screen p-6 lg:p-8 ${bgMain}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome Back! 👋
          </h1>
          <p className={`mt-1 ${textMuted}`}>Aapki dukaan ka hisaab-kitab.</p>
        </div>

        <div className="relative">
          <select
            value={profitFilter}
            onChange={(e) => setProfitFilter(e.target.value)}
            className={`appearance-none pr-10 pl-4 py-2.5 rounded-lg border font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${
              themeMode === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown
              size={18}
              className={
                themeMode === "dark" ? "text-gray-400" : "text-gray-500"
              }
            />
          </div>
        </div>
      </div>

      {/* 1. QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 print:hidden">
        <Link
          to="/pos"
          className={`${actionCardBase} ${activeStyle.cardHover}`}
        >
          <div className={`p-3 rounded-xl ${activeStyle.iconBox}`}>
            <FilePlus size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight">Naya Bill</h3>
            <p className={`${textMuted} text-[11px] mt-0.5`}>Create Sale</p>
          </div>
        </Link>

        <Link
          to="/products"
          className={`${actionCardBase} ${activeStyle.cardHover}`}
        >
          <div className={`p-3 rounded-xl ${activeStyle.iconBox}`}>
            <PackagePlus size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight">Naya Maal</h3>
            <p className={`${textMuted} text-[11px] mt-0.5`}>Add Inventory</p>
          </div>
        </Link>

        <Link
          to="/customers"
          className={`${actionCardBase} ${paymentStyle.cardHover}`}
        >
          <div className={`p-3 rounded-xl ${paymentStyle.iconBox}`}>
            <HandCoins size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight">
              Payment Receive
            </h3>
            <p className={`${textMuted} text-[11px] mt-0.5`}>Udhaar Vasooli</p>
          </div>
        </Link>

        <Link
          to="/expenses"
          className={`${actionCardBase} ${expenseStyle.cardHover}`}
        >
          <div className={`p-3 rounded-xl ${expenseStyle.iconBox}`}>
            <Wallet size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight">
              Kharcha Likhein
            </h3>
            <p className={`${textMuted} text-[11px] mt-0.5`}>Add Expense</p>
          </div>
        </Link>
      </div>

      {/* 2. TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm font-medium ${textMuted}`}>
                Total Sale ({profitFilter})
              </p>
              <h3 className="text-2xl font-bold mt-2 flex items-center">
                <IndianRupee size={24} className="mr-1" />{" "}
                {stats.totalSale.toLocaleString("en-IN")}
              </h3>
            </div>
            <div
              className={`p-3 rounded-lg ${themeMode === "dark" ? `bg-${primaryColor}-900/30 text-${primaryColor}-400` : `bg-${primaryColor}-100 text-${primaryColor}-600`}`}
            >
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm font-medium ${textMuted}`}>
                Net Profit ({profitFilter})
              </p>
              <h3 className="text-2xl font-bold mt-2 flex items-center">
                <IndianRupee size={24} className="mr-1" />{" "}
                {stats.netProfit.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${themeMode === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm font-medium ${textMuted}`}>
                Total Outstanding (Lena Hai)
              </p>
              <h3 className={`text-2xl font-bold mt-2 flex items-center ${themeMode === "dark" ? "text-green-400" : "text-green-600"}`}>
                <IndianRupee size={24} className="mr-1" />{" "}
                {stats.receivables.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${themeMode === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-600"}`}>
              <ArrowDownRight size={24} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-sm font-medium ${textMuted}`}>
                To Pay (Dena Hai)
              </p>
              <h3 className={`text-2xl font-bold mt-2 flex items-center ${themeMode === "dark" ? "text-red-400" : "text-red-600"}`}>
                <IndianRupee size={24} className="mr-1" />{" "}
                {stats.payables.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${themeMode === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. ALERTS SECTION */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <AlertCircle
          size={24}
          className={
            themeMode === "dark" ? "text-yellow-400" : "text-yellow-500"
          }
        />{" "}
        Smart Alerts
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-500">
            <Flame size={20} /> Low Stock Alert
          </h3>
          <div className="space-y-4">
            {lowStockItems.length === 0 ? (
              <p className={`text-sm p-2 ${textMuted}`}>
                Sab sahi hai! Kisi bhi maal ka stock low nahi hai.
              </p>
            ) : (
              lowStockItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center p-4 rounded-lg border ${themeMode === "dark" ? "bg-orange-950/40 border-orange-900/50 text-orange-50" : "bg-orange-50 border-orange-100 text-gray-900"}`}
                >
                  <div>
                    <p className="font-medium text-base">{item.name}</p>
                    <p
                      className={`text-sm mt-0.5 ${themeMode === "dark" ? "text-orange-200/70" : "text-gray-500"}`}
                    >
                      Only{" "}
                      <span className="font-bold text-red-500">
                        {item.stock} left
                      </span>{" "}
                      in stock
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/suppliers")}
                    className="flex flex-col items-center justify-center p-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                  >
                    <MessageCircle size={18} className="mb-1" />
                    <span className="text-[11px] font-bold">Order Again</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-500">
            <Snowflake size={20} /> Dead Stock (No Sales)
          </h3>
          <div className="space-y-4">
            {deadStock.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-4 rounded-lg border ${themeMode === "dark" ? "bg-blue-950/40 border-blue-900/50 text-blue-50" : "bg-blue-50 border-blue-100 text-gray-900"}`}
              >
                <div>
                  <p className="font-medium text-base">{item.name}</p>
                  <p
                    className={`text-sm mt-0.5 ${themeMode === "dark" ? "text-blue-200/70" : "text-gray-500"}`}
                  >
                    Unsold for {item.days} days
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${themeMode === "dark" ? "text-blue-200" : "text-gray-600"}`}
                  >
                    Stock: {item.stock}
                  </p>
                  <button className="text-xs font-bold text-blue-500 hover:text-blue-400 hover:underline mt-1">
                    Clearance Sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
