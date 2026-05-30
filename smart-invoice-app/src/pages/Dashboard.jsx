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
  X,
  Send,
  Bot,
  User,
  Loader2,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const { themeMode, primaryColor, businessName } = useSettingsStore();
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

  // ==========================================
  // SMART AI STATES & EFFECTS
  // ==========================================
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: "bot", 
      text: "Namaste Jitendra bhai! 🙏 Main aapka **Smart Khata Bot** (AI accountant) hoon. Dukan ka koi bhi hisaab-kitab poochiye, main haazir hoon!" 
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [predictions, setPredictions] = useState([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setPredictionsLoading(true);
      try {
        const data = await api.getInventoryPrediction();
        if (active) setPredictions(data);
      } catch (err) {
        console.error("Failed to load inventory predictions", err);
      } finally {
        if (active) setPredictionsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleAskBot = async (customQuery) => {
    const textToAsk = customQuery || chatQuery;
    if (!textToAsk.trim()) return;

    const userMsg = { sender: "user", text: textToAsk };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatQuery("");
    setChatLoading(true);

    try {
      const response = await api.askKhataBot(textToAsk);
      const botMsg = { sender: "bot", text: response.answer };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Khata Bot call failed:", err);
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: "bot", 
          text: "Maaf kijiyega, backend connect nahi ho paya. Kripya check karein ki server chal raha hai." 
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

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

      {/* 4. AI INVENTORY FORECAST */}
      <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2">
        <Calendar
          size={24}
          className={
            themeMode === "dark" ? "text-purple-400" : "text-purple-600"
          }
        />{" "}
        Smart Inventory Prediction (Maal Kab Khatam Hoga?)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {predictionsLoading ? (
          <div className={`col-span-2 p-10 rounded-xl border flex flex-col items-center justify-center ${cardBg}`}>
            <Loader2 className="animate-spin text-purple-500 mb-2" size={36} />
            <p className={textMuted}>AI Stock Forecast compute kiya ja raha hai...</p>
          </div>
        ) : predictions.length === 0 ? (
          <div className={`col-span-2 p-8 rounded-xl border text-center ${cardBg}`}>
            <p className={textMuted}>Lagta hai abhi stock levels absolutely normal hain! Predictions empty hain.</p>
          </div>
        ) : (
          predictions.map((pred, index) => {
            const isCritical = pred.daysRemaining <= 2;
            const borderColors = isCritical 
              ? themeMode === "dark" ? "bg-red-950/20 border-red-900/50 text-red-50" : "bg-red-50 border-red-100 text-gray-900"
              : themeMode === "dark" ? "bg-yellow-950/20 border-yellow-900/50 text-yellow-50" : "bg-yellow-50 border-yellow-100 text-gray-900";
            const daysText = pred.daysRemaining === 1 ? "1 din" : `${pred.daysRemaining} din`;
            
            const whatsAppText = encodeURIComponent(
              `*Dear ${pred.supplierName || "Supplier"},*\n\n` +
              `*🧾 Re-order Request from ${businessName || "My Shop"}*\n` +
              `Humey aapki taraf se niche likha stock urgently chahiye:\n` +
              `- *Item:* ${pred.productName}\n` +
              `- *Urgency:* Critical (Depletion in ${pred.daysRemaining} days)\n\n` +
              `Kripya stock confirm karein aur delivery arrange karwayein. Dhanyawaad! 🙏`
            );

            return (
              <div key={index} className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 transform hover:-translate-y-1 shadow-sm ${borderColors}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{pred.productName}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wider ${
                      isCritical ? "bg-red-500 text-white animate-pulse" : "bg-yellow-500 text-black"
                    }`}>
                      {isCritical ? "CRITICAL ALERT" : "WARNING"}
                    </span>
                  </div>
                  <p className="text-sm mt-1 opacity-90 font-medium">
                    Current Stock: <span className="font-bold">{pred.currentStock} units</span> ({pred.velocity})
                  </p>
                  <p className="text-xs mt-1.5 opacity-80 italic">
                    AI Reason: "{pred.reason}"
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs opacity-75">
                    <span className="font-bold">Supplier:</span> {pred.supplierName || "N/A"} ({pred.supplierPhone || "N/A"})
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-stretch gap-2.5 w-full sm:w-auto">
                  <div className="flex-1 text-center py-2 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Runs Dry In</span>
                    <span className={`text-2xl font-black ${isCritical ? "text-red-500" : "text-yellow-500"}`}>{daysText}</span>
                  </div>
                  <a
                    href={`https://api.whatsapp.com/send?phone=91${pred.supplierPhone || "9876543210"}&text=${whatsAppText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <MessageCircle size={15} /> Order Now
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================== */}
      {/* 5. SMART KHATA BOT FLOATING WIDGET */}
      {/* ========================================== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        {/* Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 cursor-pointer ${
            chatOpen
              ? "bg-red-500 hover:bg-red-600 text-white"
              : `bg-${primaryColor === "blue" ? "blue-600 hover:bg-blue-700" : primaryColor === "green" ? "green-600 hover:bg-green-700" : primaryColor === "purple" ? "purple-600 hover:bg-purple-700" : "rose-600 hover:bg-rose-700"} text-white`
          } relative`}
          style={{ width: "60px", height: "60px" }}
          title="Smart Khata Bot"
        >
          {chatOpen ? <X size={28} /> : <MessageCircle size={28} />}
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${primaryColor === "blue" ? "blue" : primaryColor === "green" ? "green" : primaryColor === "purple" ? "purple" : "rose"}-400 opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-4 w-4 bg-${primaryColor === "blue" ? "blue" : primaryColor === "green" ? "green" : primaryColor === "purple" ? "purple" : "rose"}-500`}></span>
            </span>
          )}
        </button>

        {/* Chat Window Panel */}
        {chatOpen && (
          <div
            className={`mt-4 w-96 max-w-[calc(100vw-2rem)] h-[520px] rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out transform scale-100 origin-bottom-right ${
              themeMode === "dark"
                ? "bg-gray-900/95 border-gray-700 text-white backdrop-blur-md"
                : "bg-white/95 border-gray-200 text-black backdrop-blur-md"
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              themeMode === "dark" ? "bg-gray-800/80 border-gray-700" : "bg-gray-50 border-gray-150"
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl bg-purple-500 text-white`}>
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5 flex-row">
                    Smart Khata Bot
                    <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  </h3>
                  <p className="text-[10px] opacity-70">AI Accountant (Active)</p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {chatMessages.map((msg, index) => {
                const isBot = msg.sender === "bot";
                return (
                  <div key={index} className={`flex items-start gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}>
                    <div className={`p-2 rounded-xl flex items-center justify-center ${
                      isBot ? "bg-purple-500 text-white" : "bg-emerald-500 text-white"
                    }`}>
                      {isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`p-3.5 rounded-2xl max-w-[75%] text-xs leading-relaxed ${
                      isBot 
                        ? themeMode === "dark" ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-800"
                        : "bg-purple-600 text-white"
                    }`}>
                      <p className="whitespace-pre-wrap">
                        {msg.text.split("**").map((part, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold">{part}</strong> : part)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500 text-white">
                    <Bot size={16} />
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-1.5 ${
                    themeMode === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"
                  }`}>
                    <Loader2 size={14} className="animate-spin text-purple-500" />
                    <span>Hisaab checked...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Predefined Quick Questions */}
            <div className={`px-4 py-2 border-t flex flex-wrap gap-1.5 ${
              themeMode === "dark" ? "bg-gray-800/40 border-gray-700" : "bg-gray-50/55 border-gray-150"
            }`}>
              <button
                onClick={() => handleAskBot("Bhai dekh ke batao is mahine sabse zyada kharcha kis cheez pe hua?")}
                disabled={chatLoading}
                className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border border-purple-500/25 transition-all cursor-pointer"
              >
                💸 Sabse bada kharcha?
              </button>
              <button
                onClick={() => handleAskBot("Kaun se customer ka udhaar limit khatam hone wala hai?")}
                disabled={chatLoading}
                className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/25 transition-all cursor-pointer"
              >
                💳 Credit Limit warn?
              </button>
              <button
                onClick={() => handleAskBot("Kaun sa maal khatam ho raha hai?")}
                disabled={chatLoading}
                className="text-[10px] font-bold px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/25 transition-all cursor-pointer"
              >
                📦 Low stock info?
              </button>
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskBot();
              }}
              className={`p-3 border-t flex gap-2 items-center ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <input
                type="text"
                placeholder="Ask bot in Hinglish/Hindi/English..."
                value={chatQuery}
                disabled={chatLoading}
                onChange={(e) => setChatQuery(e.target.value)}
                className={`flex-1 px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all ${
                  themeMode === "dark"
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-300 text-black shadow-inner"
                }`}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatQuery.trim()}
                className={`p-2 rounded-xl transition-all cursor-pointer shadow-md ${
                  chatLoading || !chatQuery.trim()
                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105"
                }`}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
