import { useState, useEffect } from "react";
import useSettingsStore from "../store/settingsStore";
// 1. DYNAMIC IMPORT: Data folder se customers ko import kiya
import { initialCustomers } from "../data/mockData";
import * as api from "../api";
import { translations } from "../data/translations";

import {
  Users,
  Search,
  UserPlus,
  HandCoins,
  MessageCircle,
  Trash2,
  X,
  ArrowUpRight,
  IndianRupee,
  Filter,
  ChevronDown,
  Phone,
  AlertTriangle,
  Edit,
  Printer,
  Grid,
  List,
  Send,
  CheckCircle,
} from "lucide-react";

const Customers = () => {
  const { themeMode, primaryColor, businessName, language } = useSettingsStore();

  const t = translations[language || "en"] || translations.en;

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All"); // All, Udhaar, Clear, Highest
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [loading, setLoading] = useState(true);

  // Form States
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    openingBalance: "",
    creditLimit: "5000",
    dueDate: "",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");

  // Strict Theme Colors (100% Dark Mode Safe)
  const bgMain =
    themeMode === "dark"
      ? "bg-gray-900 text-white"
      : "bg-gray-50 text-gray-900";
  const cardBg =
    themeMode === "dark"
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200";
  const textMuted = themeMode === "dark" ? "text-gray-400" : "text-gray-500";
  const inputBg =
    themeMode === "dark"
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-gray-50 border-gray-300 text-black";
  const rowHover =
    themeMode === "dark" ? "hover:bg-gray-750" : "hover:bg-gray-50";

  // 2. Load customers from backend (fallback to mock data if fetch fails)
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getCustomers();
        if (!mounted) return;
        const mapped = data.map((c) => ({
          id: c._id || c.id,
          name: c.name,
          phone: c.phone,
          balance: c.totalDue ?? c.currentBalance ?? 0,
          creditLimit: c.creditLimit ?? 5000,
          dueDate: c.dueDate ?? "",
          lastPaid: "N/A",
        }));
        setCustomers(mapped);
      } catch (err) {
        console.error("Error loading customers from backend, falling back to mock data:", err);
        setCustomers(initialCustomers);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    (async () => {
      try {
        const data = await api.getBankAccounts();
        if (!mounted) return;
        setBankAccounts(data);
        if (data.length > 0) {
          setSelectedBankId(data[0]._id || data[0].id);
        }
      } catch (err) {
        console.error("Error loading bank accounts in Customers", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Search, Filter & Sorting Logic
  const getFilteredAndSortedCustomers = () => {
    let result = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm),
    );

    if (filterType === "Udhaar") {
      result = result.filter((c) => c.balance > 0);
    } else if (filterType === "Clear") {
      result = result.filter((c) => c.balance === 0);
    } else if (filterType === "OverLimit") {
      result = result.filter((c) => c.balance > c.creditLimit);
    }

    if (filterType === "Highest") {
      result = [...result].sort((a, b) => b.balance - a.balance);
    }

    return result;
  };

  const filteredCustomers = getFilteredAndSortedCustomers();
  const totalOutstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const overLimitCustomersCount = customers.filter((c) => c.balance > c.creditLimit).length;

  // Handlers
  const handleAddCustomer = (e) => {
    e.preventDefault();
    const payload = {
      name: newCustomer.name,
      phone: newCustomer.phone,
      creditLimit: Number(newCustomer.creditLimit) || 5000,
      totalDue: Number(newCustomer.openingBalance) || 0,
      currentBalance: Number(newCustomer.openingBalance) || 0,
      dueDate: newCustomer.dueDate || "",
    };
    (async () => {
      try {
        if (editingId) {
          const updated = await api.updateCustomer(editingId, payload);
          setCustomers(
            customers.map((c) =>
              c.id === editingId
                ? {
                    ...c,
                    name: updated.name,
                    phone: updated.phone,
                    balance: updated.totalDue ?? updated.currentBalance ?? 0,
                    creditLimit: updated.creditLimit ?? 5000,
                    dueDate: updated.dueDate ?? "",
                  }
                : c,
            ),
          );
          setEditingId(null);
        } else {
          const created = await api.createCustomer(payload);
          const customerObj = {
            id: created._id || created.id,
            name: created.name,
            phone: created.phone,
            balance: created.totalDue ?? created.currentBalance ?? 0,
            creditLimit: created.creditLimit ?? 5000,
            dueDate: created.dueDate ?? "",
            lastPaid: "Never",
          };
          setCustomers([customerObj, ...customers]);
        }
        setIsAddModalOpen(false);
        setNewCustomer({
          name: "",
          phone: "",
          openingBalance: "",
          creditLimit: "5000",
          dueDate: "",
        });
      } catch (err) {
        console.error("Save customer failed", err);
      }
    })();
  };

  const openPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setIsPaymentModalOpen(true);
  };

  const handleReceivePayment = (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    const newBalance = Math.max(0, selectedCustomer.balance - amount);
    (async () => {
      try {
        await api.updateCustomer(selectedCustomer.id, {
          totalDue: newBalance,
          paymentMethod: paymentMethod,
          selectedBankId: (paymentMethod === "Cheque" || paymentMethod === "UPI") ? selectedBankId : undefined,
          paidAmount: amount,
          chequeNumber: (paymentMethod === "Cheque" || paymentMethod === "UPI") ? chequeNumber : undefined,
          customerName: selectedCustomer.name,
          paymentDate: new Date().toISOString().split("T")[0]
        });
        setCustomers(
          customers.map((c) => {
            if (c.id === selectedCustomer.id) {
              return {
                ...c,
                balance: newBalance,
                lastPaid: "Today",
              };
            }
            return c;
          }),
        );
      } catch (err) {
        console.error("Receive payment failed", err);
      }
    })();
    setIsPaymentModalOpen(false);
    setPaymentAmount("");
    setPaymentMethod("Cash");
    setChequeNumber("");
    setSelectedCustomer(null);
  };

  const handleEditCustomer = (customer) => {
    setEditingId(customer.id);
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      openingBalance: customer.balance.toString(),
      creditLimit: customer.creditLimit.toString(),
      dueDate: customer.dueDate || "",
    });
    setIsAddModalOpen(true);
  };

  const handleWhatsAppReminder = (customer) => {
    if (customer.balance === 0) return;

    const shopName = businessName || "SmartInvoice Business";
    const textMessage = `Namaste ${customer.name} bhai, %0A%0AAapka hamari dukan *${shopName}* par *₹${customer.balance.toLocaleString("en-IN")}* ka udhaar (pending balance) baqaya hai. %0AKripya isey waqt par jama karein taaki aapka credit score sahi rahe. %0A%0A_Generated via SmartInvoice ERP_`;

    const cleanPhone = customer.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert(t.invalidPhoneAlert || "Invalid customer phone number for WhatsApp!");
      return;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${textMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm(t.deleteConfirm || "Kya aap is customer ka khata hatana chahte hain?")) {
      setCustomers(customers.filter((c) => c.id !== id));
      (async () => {
        try {
          await api.deleteCustomer(id);
        } catch (err) {
          console.error("Delete customer failed", err);
        }
      })();
    }
  };

  const handlePrintLedger = () => {
    const originalTitle = document.title;
    document.title = "Customers_Ledger_Report_" + new Date().toISOString().slice(0, 10);

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #ledger-print-area, #ledger-print-area * {
          visibility: visible;
        }
        #ledger-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
    document.title = originalTitle;
  };

  return (
    <div className={`min-h-screen p-6 lg:p-8 ${bgMain}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users size={32} className={`text-${primaryColor}-500`} />
            {t.customersTitle || "Grahak Khata (Customers)"}
          </h1>
          <p className={`mt-1 ${textMuted}`}>
            {t.customersSubtitle || "Dukaan ka digital credit ledger / udhaar book."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* List/Grid toggle buttons */}
          <div className={`flex items-center p-1 rounded-xl border ${themeMode === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? `bg-${primaryColor}-600 text-white`
                  : themeMode === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-150"
              }`}
              title="Grid Cards View"
            >
              <Grid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? `bg-${primaryColor}-600 text-white`
                  : themeMode === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-gray-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-150"
              }`}
              title="List Table View"
            >
              <List size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintLedger}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${themeMode === "dark" ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-750" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            <Printer size={20} /> Print Ledger Sheet
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setNewCustomer({
                name: "",
                phone: "",
                openingBalance: "",
                creditLimit: "5000",
                dueDate: "",
              });
              setIsAddModalOpen(true);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md bg-${primaryColor}-600 text-white hover:bg-${primaryColor}-700 hover:-translate-y-0.5`}
          >
            <UserPlus size={20} /> {t.addCustomer || "Naya Grahak Jodein"}
          </button>
        </div>
      </div>

      {/* Active OVER LIMIT Alert System Warning Banner */}
      {overLimitCustomersCount > 0 && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-4 border-red-500/30 ${
          themeMode === "dark" 
            ? "bg-red-950/40 text-red-400" 
            : "bg-red-50 text-red-700"
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="animate-pulse text-red-500" size={24} />
            <div>
              <p className="font-bold text-sm">⚠️ High Risk Udhaar Warning!</p>
              <p className="text-xs opacity-90 mt-0.5">
                {overLimitCustomersCount} customer(s) have exceeded their credit limit! Please send reminders or halt credit checkouts.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setFilterType("OverLimit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap hover:scale-105 ${
              themeMode === "dark" 
                ? "bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700" 
                : "bg-red-200 hover:bg-red-300 text-red-800 border border-red-300"
            }`}
          >
            Review Accounts
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card 1: Market Outstanding */}
        <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${cardBg}`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${themeMode === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
              <ArrowUpRight size={28} />
            </div>
            <div>
              <p className={`text-sm font-semibold tracking-wide ${textMuted}`}>
                {t.totalOutstanding || "Total Market Outstanding"}
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-red-500 flex items-center">
                <IndianRupee size={28} className="mr-0.5" />{" "}
                {totalOutstanding.toLocaleString("en-IN")}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: Over Limit Customers */}
        <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${cardBg}`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${themeMode === "dark" ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600"}`}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className={`text-sm font-semibold tracking-wide ${textMuted}`}>
                {t.overLimitCustomers || "Over Limit Customers"}
              </p>
              <h3 className="text-3xl font-extrabold mt-1 text-amber-500 flex items-center gap-3">
                {overLimitCustomersCount}
                {overLimitCustomersCount > 0 && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border animate-pulse ${themeMode === "dark" ? "bg-red-950 text-red-400 border-red-900" : "bg-red-100 text-red-700 border-red-300"}`}>
                    🚨 {t.overLimitLabel || "OVER LIMIT"}
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Panel */}
      <div className={`p-4 rounded-2xl border shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${cardBg}`}>
        <div className="w-full md:w-auto">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Filter size={18} className={`text-${primaryColor}-500`} />
            {t.filterAll || "Sabhi Grahak"}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto justify-end">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={textMuted} />
            </div>
            <input
              type="text"
              placeholder={t.searchCustomerPlaceholder || "Search name or phone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none transition-all ${inputBg}`}
              style={{ borderColor: `var(--color-${primaryColor}-500)` }}
            />
          </div>

          {/* Filter Selector */}
          <div className="relative w-full sm:w-56">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none font-medium cursor-pointer transition-all ${inputBg}`}
            >
              <option value="All">{t.filterAll || "Sabhi Grahak"}</option>
              <option value="Udhaar">{t.filterUdhaar || "Udhaar Baaki"}</option>
              <option value="Clear">{t.filterClear || "Hisaab Clear"}</option>
              <option value="Highest">⚠️ {t.filterHighest || "Highest Udhaar First"}</option>
              <option value="OverLimit">🚨 {t.filterOverLimit || "Over Limit Customers"}</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className={textMuted} />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className={textMuted} />
            </div>
          </div>
        </div>
      </div>

      {/* LOADING STATE PLACEHOLDER */}
      {loading ? (
        <div className="p-12 text-center font-bold text-lg flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          <span>Khata Book sync ho rahi hai...</span>
        </div>
      ) : viewMode === "grid" ? (
        /* CARD GRID DIRECTORY */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCustomers.length === 0 ? (
            <div className={`col-span-full p-12 text-center ${textMuted} rounded-2xl border ${cardBg}`}>
              {t.noCustomersFound || "Koi grahak nahi mila."}
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isOverLimit = customer.balance > customer.creditLimit;
              return (
                <div 
                  key={customer.id} 
                  className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.015] hover:shadow-md ${cardBg}`}
                >
                  {/* Upper Identity Blocks */}
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black tracking-tight">{customer.name}</h3>
                        <div className={`flex items-center gap-1 text-xs mt-1 ${textMuted}`}>
                          <Phone size={11} />
                          <span>+91 {customer.phone || "---"}</span>
                          {customer.phone && (
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-blue-500 hover:text-blue-400 p-0.5 animate-pulse ml-1"
                              title={t.directPhoneCall || "Direct Phone Call"}
                            >
                              <Phone size={10} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* DYNAMIC RISK INDICATOR BADGE */}
                      {isOverLimit ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase tracking-wider bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 animate-pulse">
                          <AlertTriangle size={12} /> Over Limit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                          <CheckCircle size={12} /> Safe Account
                        </span>
                      )}
                    </div>

                    {/* Financial Balance Bars */}
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between items-end">
                        <span className={`text-xs font-bold ${textMuted}`}>Outstanding Udhaar:</span>
                        <span className={`text-2xl font-black ${isOverLimit ? "text-red-500" : themeMode === "dark" ? "text-white" : "text-gray-900"}`}>
                          ₹{customer.balance.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Progress visual limit tracker */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${isOverLimit ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min((customer.balance / customer.creditLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-[11px] font-bold text-gray-400">
                        <span>Limit: ₹{customer.creditLimit}</span>
                        {customer.dueDate && <span className="text-amber-500 flex items-center gap-0.5">📅 Due: {customer.dueDate}</span>}
                      </div>
                    </div>
                  </div>

                  {/* ACTION TRIGGER BUTTONS */}
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                    
                    {/* Send WhatsApp Reminder Button (User's layout) */}
                    <button
                      onClick={() => handleWhatsAppReminder(customer)}
                      disabled={customer.balance === 0}
                      className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        customer.balance === 0
                          ? themeMode === "dark"
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                          : isOverLimit 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-red-500/10 cursor-pointer" 
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10 cursor-pointer"
                      }`}
                    >
                      <Send size={14} /> Send WhatsApp Reminder
                    </button>

                    {/* Operational Actions */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      {customer.balance > 0 ? (
                        <button
                          onClick={() => openPaymentModal(customer)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                            themeMode === "dark"
                              ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border-emerald-800"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                          }`}
                        >
                          <HandCoins size={14} /> {t.vasooliBtn || "Vasooli"}
                        </button>
                      ) : (
                        <div className="flex-1 text-center py-2 text-xs font-bold text-green-500 bg-green-500/10 rounded-xl">
                          Hisaab Clear 👍
                        </div>
                      )}

                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className={`p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
                          themeMode === "dark"
                            ? "border-blue-900 text-blue-400 hover:bg-blue-950/50"
                            : "border-blue-200 text-blue-600 hover:bg-blue-50"
                        }`}
                        title={t.editKhata || "Edit Khata"}
                      >
                        <Edit size={15} />
                      </button>

                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className={`p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
                          themeMode === "dark"
                            ? "border-red-900 text-red-400 hover:bg-red-950/50"
                            : "border-red-200 text-red-600 hover:bg-red-50"
                        }`}
                        title={t.deleteKhata || "Delete Khata"}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ORIGINAL PREMIUM TABLE VIEW */
        <div className={`rounded-xl border shadow-sm overflow-hidden mb-8 ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b ${themeMode === "dark" ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"}`}
                >
                  <th className="p-4 font-semibold text-sm">{t.customerDetailsCol || "Grahak Details"}</th>
                  <th className="p-4 font-semibold text-sm">{t.phoneCol || "Phone Number"}</th>
                  <th className="p-4 font-semibold text-sm">{t.creditLimitCol || "Credit Limit"}</th>
                  <th className="p-4 font-semibold text-sm">
                    {t.outstandingCol || "Baqaya Udhaar / Last Paid"}
                  </th>
                  <th className="p-4 font-semibold text-sm text-center">
                    {t.actionsCol || "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`p-8 text-center ${textMuted}`}>
                      {t.noCustomersFound || "Koi grahak nahi mila."}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isOverLimit = customer.balance > customer.creditLimit;

                    return (
                      <tr
                        key={customer.id}
                        className={`border-b transition-colors duration-150 ${themeMode === "dark" ? "border-gray-700" : "border-gray-100"} ${rowHover}`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-base flex items-center gap-2">
                            {customer.name}
                            {isOverLimit && (
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black border animate-pulse ${themeMode === "dark" ? "bg-red-950 text-red-400 border-red-900" : "bg-red-100 text-red-700 border-red-300"}`}>
                                <AlertTriangle size={10} /> {t.overLimitLabel || "OVER LIMIT"}
                              </span>
                            )}
                          </div>
                          {customer.dueDate && (
                            <div className={`text-xs flex items-center gap-1 mt-1 ${themeMode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                              <span>📅 Due:</span>
                              <span className="font-semibold text-red-500">{customer.dueDate}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <span>{customer.phone || "---"}</span>
                            {customer.phone && (
                              <a
                                href={`tel:${customer.phone}`}
                                className="text-blue-500 hover:text-blue-400 p-0.5 animate-pulse"
                                title={t.directPhoneCall || "Direct Phone Call"}
                              >
                                <Phone size={12} />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className={`p-4 text-sm font-medium ${textMuted}`}>
                          <span className="flex items-center text-xs">
                            <IndianRupee size={12} />
                            {customer.creditLimit}
                          </span>
                        </td>

                        <td className="p-4">
                          {customer.balance > 0 ? (
                            <div>
                              <span className="inline-flex items-center gap-0.5 font-extrabold text-red-500 text-base">
                                <IndianRupee size={16} /> {customer.balance}
                              </span>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {t.paidLabel || "Paid:"} {customer.lastPaid}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${themeMode === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}>
                                {t.clearLabel || "Clear 👍"}
                              </span>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {t.paidLabel || "Paid:"} {customer.lastPaid}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* ACTIONS ROW - FIXED & ALIGNED */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center gap-3 w-full">
                            {/* 1. Vasooli Button with Fixed Spacer */}
                            {customer.balance > 0 ? (
                              <button
                                onClick={() => openPaymentModal(customer)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors h-9 cursor-pointer ${
                                  themeMode === "dark"
                                    ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                }`}
                              >
                                <HandCoins size={14} /> {t.vasooliBtn || "Vasooli"}
                              </button>
                            ) : (
                              <div className="w-[84px] h-9 invisible sm:block"></div>
                            )}

                            {/* 2. WhatsApp Button */}
                            <button
                              onClick={() => handleWhatsAppReminder(customer)}
                              disabled={customer.balance === 0}
                              className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                customer.balance === 0
                                  ? themeMode === "dark"
                                    ? "border-gray-700 text-gray-600 cursor-not-allowed opacity-40"
                                    : "border-gray-200 text-gray-300 cursor-not-allowed opacity-40"
                                  : themeMode === "dark"
                                    ? "border-green-800 text-green-400 hover:bg-green-950/50"
                                    : "border-green-200 text-green-600 hover:bg-green-50"
                              }`}
                              title={
                                customer.balance > 0
                                  ? t.sendWhatsAppReminder || "Send WhatsApp Reminder"
                                  : t.noBalanceToRemind || "No balance to remind"
                              }
                            >
                              <MessageCircle size={16} />
                            </button>

                            {/* 3. Edit Button */}
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                themeMode === "dark"
                                  ? "border-blue-900 text-blue-400 hover:bg-blue-950/50"
                                    : "border-blue-200 text-blue-600 hover:bg-blue-50"
                              }`}
                              title={t.editKhata || "Edit Khata"}
                            >
                              <Edit size={16} />
                            </button>

                            {/* 4. Delete Button */}
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                themeMode === "dark"
                                  ? "border-red-900 text-red-400 hover:bg-red-950/50"
                                  : "border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                              title={t.deleteKhata || "Delete Khata"}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD CUSTOMER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
          >
            <div
              className={`flex justify-between items-center p-5 border-b ${themeMode === "dark" ? "border-gray-700" : "border-gray-200"}`}
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserPlus size={20} className={`text-${primaryColor}-500`} />{" "}
                {editingId ? t.editCustomerTitle || "Edit Customer Khata" : t.addCustomerTitle || "Add New Customer Khata"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingId(null);
                }}
                className={`p-2 rounded-full transition-colors ${themeMode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label
                  className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                >
                  {t.grahakName || "Customer Name"}
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                  placeholder={t.customerNamePlaceholder || "e.g. Pappu Kumar"}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                >
                  {t.phoneNumber || "Phone Number"}
                </label>
                <input
                  type="text"
                  maxLength="10"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                  placeholder={t.phonePlaceholder || "10 digit phone number"}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                  >
                    {t.openingUdhaarLabel || "Opening Udhaar"}
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                    >
                      <IndianRupee size={14} />
                    </div>
                    <input
                      type="number"
                      value={newCustomer.openingBalance}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          openingBalance: e.target.value,
                        })
                      }
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                  >
                    {t.creditLimitLabel || "Credit Limit"}
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                    >
                      <IndianRupee size={14} />
                    </div>
                    <input
                      type="number"
                      value={newCustomer.creditLimit}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          creditLimit: e.target.value,
                        })
                      }
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                >
                  Due Date (Kab tak paisa lautana hai)
                </label>
                <input
                  type="date"
                  value={newCustomer.dueDate || ""}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, dueDate: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingId(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold ${themeMode === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold text-white bg-${primaryColor}-600 hover:bg-${primaryColor}-700`}
                >
                  {editingId ? t.updateKhata || "Update Khata" : t.khataKholein || "Khata Kholein"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VASOOLI ENTRY */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
          >
            <div
              className={`flex justify-between items-center p-5 border-b ${themeMode === "dark" ? "border-gray-700" : "border-gray-200"}`}
            >
              <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-500">
                <HandCoins size={20} /> {t.paymentReceiveTitle || "Payment Receive (Vasooli)"}
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className={`p-2 rounded-full transition-colors ${themeMode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReceivePayment} className="p-5 space-y-4">
              <div
                className={`p-4 rounded-xl border border-dashed ${themeMode === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}
              >
                <p className="text-xs font-semibold text-gray-500">{t.grahakLabel || "Grahak:"}</p>
                <p className="text-lg font-bold mt-0.5">
                  {selectedCustomer.name}
                </p>
                <p className="text-xs font-semibold text-gray-500 mt-2">
                  {t.baqayaUdhaarLabel || "Baqaya Udhaar:"}
                </p>
                <p className="text-xl font-black text-red-500 flex items-center mt-0.5">
                  <IndianRupee size={18} className="mr-0.5" /> {selectedCustomer.balance}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                >
                  <option value="Cash">Cash (Galla)</option>
                  <option value="UPI">Online (UPI)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Target Bank Account Dropdown */}
              {(paymentMethod === "UPI" || paymentMethod === "Cheque") && bankAccounts.length > 0 && (
                <div>
                  <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}>
                    Select Target Bank Account
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc._id || acc.id} value={acc._id || acc.id}>
                        {acc.bankName} - {acc.accountName} (₹{acc.currentBalance.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reference/Cheque Number */}
              {(paymentMethod === "UPI" || paymentMethod === "Cheque") && (
                <div>
                  <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}>
                    {paymentMethod === "Cheque" ? "Cheque Number" : "UPI Ref Number"}
                  </label>
                  <input
                    type="text"
                    required
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                    placeholder={paymentMethod === "Cheque" ? "Enter Cheque Number" : "Enter UPI Ref Number"}
                  />
                </div>
              )}

              <div>
                <label
                  className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                >
                  {t.kitnePaiseMile || "Kitne Paise Mile?"}
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                  >
                    <IndianRupee size={16} />
                  </div>
                  <input
                    type="number"
                    required
                    max={selectedCustomer.balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                    placeholder={t.amountPlaceholder || "Amount enter karein"}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${themeMode === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  {t.jamaKarein || "Jama Karein (Save)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* HIDDEN PRINT AREA FOR CUSTOMERS LEDGER */}
      <div id="ledger-print-area" className="hidden print:block p-8 font-mono text-[11px] leading-tight text-black bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
            📒 Customers Credit Ledger (Khata Report) 📒
          </h1>
          <p className="text-xs font-semibold">Generated on: {new Date().toLocaleString("en-IN")}</p>
          <div className="border-b-2 border-black my-4"></div>
        </div>

        {/* SUMMARY BOARD FOR AUDITING */}
        <div className="grid grid-cols-3 gap-4 mb-6 border p-3 bg-gray-50 rounded">
          <div>
            <span className="font-bold block">Total Customers:</span>
            <span>{filteredCustomers.length} registered</span>
          </div>
          <div>
            <span className="font-bold block">Market Outstanding (Lena Hai):</span>
            <span>₹{filteredCustomers.reduce((sum, c) => sum + c.balance, 0).toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span className="font-bold block">Over Limit Grahak:</span>
            <span>{filteredCustomers.filter(c => c.balance > c.creditLimit).length} accounts</span>
          </div>
        </div>

        {/* CUSTOMERS TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 font-bold w-8">#</th>
              <th className="py-2 font-bold">Grahak Name</th>
              <th className="py-2 font-bold">Phone Number</th>
              <th className="py-2 font-bold text-right w-24">Credit Limit</th>
              <th className="py-2 font-bold text-right w-24">Baqaya Udhaar</th>
              <th className="py-2 font-bold text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => {
              const isOverLimit = c.balance > c.creditLimit;
              return (
                <tr key={c.id} className="border-b border-gray-300">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2 font-semibold">{c.name}</td>
                  <td className="py-2">{c.phone || "---"}</td>
                  <td className="py-2 text-right">₹{c.creditLimit}</td>
                  <td className="py-2 text-right font-bold text-red-600">₹{c.balance}</td>
                  <td className="py-2 text-center">
                    {isOverLimit ? (
                      <span className="text-red-600 font-extrabold uppercase text-[9px]">⚠️ OVER LIMIT</span>
                    ) : c.balance > 0 ? (
                      <span className="text-amber-600 font-bold uppercase text-[9px]">ACTIVE</span>
                    ) : (
                      <span className="text-green-600 font-bold uppercase text-[9px]">CLEAR 👍</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* SIGNATURE BAR */}
        <div className="mt-16 flex justify-between">
          <div className="w-48 text-center border-t border-black pt-2">
            <span>Prepared By / Credit Auditor</span>
          </div>
          <div className="w-48 text-center border-t border-black pt-2">
            <span>Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
