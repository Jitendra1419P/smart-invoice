import { useState, useEffect } from "react";
import * as api from "../api";
import useSettingsStore from "../store/settingsStore";
import {
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  CreditCard,
  Plus,
  Minus,
  X,
  Search,
  IndianRupee,
  AlertTriangle,
  Check,
  Calendar,
  Edit,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Printer,
} from "lucide-react";

const BankingDashboard = () => {
  const { themeMode, primaryColor } = useSettingsStore();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({
    totalBankCash: 0,
    pendingChequesIssued: 0,
    pendingChequesReceived: 0,
    cashInHand: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All"); // All, Deposits, Withdrawals, PendingCheque

  // Add Account Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    currentBalance: "",
  });

  // Edit Account Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState({
    id: "",
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    currentBalance: "",
  });

  // Shop Cash Deposit/Withdrawal Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("Deposit"); // Deposit, Withdrawal, Transfer
  const [formData, setFormData] = useState({
    accountId: "",
    method: "Cash",
    amount: "",
    referenceNumber: "",
    description: "Shop Cash Deposit (Galla -> Bank)",
    transferTargetAccountId: "",
    chequeStatus: "None",
  });

  // Load dashboard data
  const loadData = async () => {
    try {
      const [accountsData, transactionsData, metricsData] = await Promise.all([
        api.getBankAccounts(),
        api.getBankTransactions(),
        api.getCashFlowMetrics(),
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
      setMetrics(metricsData);

      // Pre-select first account if not set yet
      if (accountsData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          accountId: prev.accountId || accountsData[0]._id || accountsData[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to load banking dashboard data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newAccount,
        currentBalance: Number(newAccount.currentBalance) || 0,
      };
      await api.createBankAccount(payload);
      setIsAddModalOpen(false);
      setNewAccount({
        accountName: "",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        currentBalance: "",
      });
      await loadData();
      alert("Naya Bank Account successfully link ho gaya hai! 🎉");
    } catch (error) {
      console.error("Failed to create bank account:", error);
      alert("Bank account save karne mein dikkat aayi.");
    }
  };

  const handleEditAccount = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        accountName: editAccount.accountName,
        bankName: editAccount.bankName,
        accountNumber: editAccount.accountNumber,
        ifscCode: editAccount.ifscCode,
        currentBalance: Number(editAccount.currentBalance) || 0,
      };
      await api.updateBankAccount(editAccount.id, payload);
      setIsEditModalOpen(false);
      await loadData();
      alert("Bank Account details successfully update ho gaye hain! 📝");
    } catch (error) {
      console.error("Failed to update bank account:", error);
      alert("Bank account details update karne mein dikkat aayi.");
    }
  };

  const handleBankAction = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Bhai sahi amount daalo!");
      return;
    }
    if (!formData.accountId) {
      alert("Kripya bank account select karein!");
      return;
    }
    if (transactionType === "Transfer") {
      if (!formData.transferTargetAccountId) {
        alert("Kripya transfer target account select karein!");
        return;
      }
      if (formData.accountId === formData.transferTargetAccountId) {
        alert("Source aur Target account same nahi ho sakte!");
        return;
      }
    }

    const sourceAcc = accounts.find(a => (a._id || a.id) === formData.accountId);
    const targetAcc = accounts.find(a => (a._id || a.id) === formData.transferTargetAccountId);

    const payload = {
      ...formData,
      type: transactionType,
      amount: Number(formData.amount),
      partyName: transactionType === "Transfer"
        ? (targetAcc ? targetAcc.accountName : "Transfer Account")
        : (formData.method === "Cash" ? "Shop Cash Galla" : "Self Transaction"),
      date: new Date().toISOString().split('T')[0],
    };

    try {
      await api.createBankTransaction(payload);
      if (transactionType === "Transfer") {
        alert(`💰 Fund Transfer of ₹${formData.amount} successful between accounts!`);
      } else {
        alert(`💰 Cash ${transactionType} entry successful across connected app routers!`);
      }
      setIsModalOpen(false);
      setFormData({
        accountId: accounts.length > 0 ? accounts[0]._id || accounts[0].id : "",
        method: "Cash",
        amount: "",
        referenceNumber: "",
        description: transactionType === "Deposit" ? "Shop Cash Deposit (Galla -> Bank)" : "Shop Cash Withdrawal (Bank -> Galla)",
        transferTargetAccountId: "",
        chequeStatus: "None",
      });
      await loadData();
    } catch (err) {
      console.error("Banking action injection failed:", err);
      alert("Transaction fail ho gaya, kripya check karein.");
    }
  };

  const handleUpdateCheque = async (transactionId, newStatus) => {
    try {
      await api.updateChequeStatus(transactionId, newStatus);
      await loadData();
      alert(`Cheque status successfully updated to "${newStatus}"!`);
    } catch (error) {
      console.error("Failed to update cheque status:", error);
      alert("Cheque status update karne mein fail hua.");
    }
  };

  // Filters and search logic
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      (t.partyName && t.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.referenceNumber && t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (activeFilter === "Deposits") {
      matchesFilter = t.type === "Deposit";
    } else if (activeFilter === "Withdrawals") {
      matchesFilter = t.type === "Withdrawal";
    } else if (activeFilter === "PendingCheque") {
      matchesFilter = t.method === "Cheque" && t.chequeStatus === "Pending";
    }

    return matchesSearch && matchesFilter;
  });

  // Strict UI Themes Tokens
  const bgMain = themeMode === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = themeMode === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textMuted = themeMode === "dark" ? "text-gray-400" : "text-gray-500";
  const inputBg = themeMode === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-black";
  const tableHeaderBg = themeMode === "dark" ? "bg-gray-900/80 text-gray-300" : "bg-gray-50 text-gray-700";
  const rowHover = themeMode === "dark" ? "hover:bg-gray-750 border-gray-700" : "hover:bg-gray-50 border-gray-100";

  return (
    <div className={`p-6 max-w-7xl mx-auto min-h-screen ${bgMain}`}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Landmark size={36} className="text-blue-500" /> Bank Accounts & Cheque Ledger
          </h1>
          <p className={`${textMuted} text-sm mt-1`}>
            Dukan ke real-time passbooks entry aur automatic bank interlinking tracker.
          </p>
        </div>

        {/* SHOPKEEPER ACTIONS & ACCOUNT LINK ACTION */}
        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            onClick={() => {
              setTransactionType("Deposit");
              setFormData({
                accountId: accounts.length > 0 ? accounts[0]._id || accounts[0].id : "",
                method: "Cash",
                amount: "",
                referenceNumber: "",
                description: "Shop Cash Deposit (Galla -> Bank)",
                transferTargetAccountId: "",
                chequeStatus: "None",
              });
              setIsModalOpen(true);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md bg-${primaryColor}-600 text-white hover:bg-${primaryColor}-700 hover:-translate-y-0.5 text-xs cursor-pointer`}
          >
            <IndianRupee size={16} /> New Transaction / Transfer
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${
              themeMode === "dark" 
                ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-750" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            } hover:-translate-y-0.5 text-xs cursor-pointer`}
          >
            <Plus size={16} /> Bank Account Link
          </button>
          <button
            onClick={() => window.print()}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${
              themeMode === "dark" 
                ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-750" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            } hover:-translate-y-0.5 text-xs cursor-pointer`}
          >
            <Printer size={16} className="text-blue-500" /> Print Ledger
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* SECTION 1: LIVE BANK ACCOUNTS DISPLAY */}
      {/* ========================================= */}
      <div className="mb-6 print:hidden">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Active Bank Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.filter(acc => acc.accountNumber !== "CASH-DRAWER").map((acc) => (
            <div
              key={acc._id}
              className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-lg ${cardBg}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider text-${primaryColor}-500`}>
                    {acc.bankName}
                  </p>
                  <h3 className="text-2xl font-black mt-1 font-mono">
                    ₹{acc.currentBalance.toLocaleString("en-IN")}
                  </h3>
                  <h4 className={`text-sm font-bold mt-2 ${themeMode === "dark" ? "text-gray-300" : "text-gray-700"}`}>{acc.accountName}</h4>
                  <p className={`text-[10px] mt-4 font-semibold ${textMuted}`}>
                    A/c: **** {acc.accountNumber.slice(-4)} | IFSC: {acc.ifscCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditAccount({
                      id: acc._id || acc.id,
                      accountName: acc.accountName,
                      bankName: acc.bankName,
                      accountNumber: acc.accountNumber,
                      ifscCode: acc.ifscCode,
                      currentBalance: acc.currentBalance.toString(),
                    });
                    setIsEditModalOpen(true);
                  }}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer absolute right-4 top-4 hover:scale-105 ${
                    themeMode === "dark"
                      ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-750"
                      : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  title="Edit Bank Details"
                >
                  <Edit size={12} />
                </button>
                <CreditCard className={`text-${primaryColor}-500/10 absolute right-4 bottom-1`} size={48} />
              </div>
            </div>
          ))}

          {/* Seeded Dynamic Cash in Hand Display */}
          {(() => {
            const cashAccount = accounts.find(acc => acc.accountNumber === "CASH-DRAWER");
            const cashBalance = cashAccount ? cashAccount.currentBalance : (metrics.cashInHand || 0);
            return (
              <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden ${cardBg}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">CASH IN HAND</p>
                    <h3 className="text-2xl font-black mt-1 font-mono text-emerald-500">
                      ₹{cashBalance.toLocaleString("en-IN")}
                    </h3>
                    <h4 className={`text-sm font-bold mt-2 ${themeMode === "dark" ? "text-gray-300" : "text-gray-700"}`}>Dukaan Cash Drawer</h4>
                    <p className={`text-[10px] mt-4 font-semibold ${textMuted}`}>
                      POS Cash Sales, collections, minus cash expenses/payments.
                    </p>
                  </div>
                  {cashAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditAccount({
                          id: cashAccount._id || cashAccount.id,
                          accountName: cashAccount.accountName,
                          bankName: cashAccount.bankName,
                          accountNumber: cashAccount.accountNumber,
                          ifscCode: cashAccount.ifscCode,
                          currentBalance: cashAccount.currentBalance.toString(),
                        });
                        setIsEditModalOpen(true);
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer absolute right-4 top-4 hover:scale-105 ${
                        themeMode === "dark"
                          ? "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-750"
                          : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      title="Edit Cash Drawer Balance"
                    >
                      <Edit size={12} />
                    </button>
                  )}
                  <ArrowUpRight className="text-emerald-500/10 absolute right-4 bottom-4" size={72} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Print-only grouped summary box */}
      <div className="hidden print:block p-5 mb-8 border-2 border-black rounded-xl bg-white text-black font-mono shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider mb-4 border-b-2 border-black pb-2 flex justify-between">
          <span>🏦 DUKAAN BANK & CASH BALANCES SUMMARY</span>
          <span className="text-[10px] font-mono normal-case text-gray-500">Statement Generated on: {new Date().toLocaleDateString('en-IN')}</span>
        </h3>
        <div className="grid grid-cols-3 gap-6 text-xs">
          {accounts.filter(acc => acc.accountNumber !== "CASH-DRAWER").map((acc) => (
            <div key={acc._id} className="border-r border-gray-300 pr-4 last:border-r-0">
              <p className="font-black text-sm uppercase text-blue-700 tracking-tight">{acc.bankName}</p>
              <p className="text-[10px] text-gray-600 font-bold mt-0.5">{acc.accountName}</p>
              <p className="text-[9px] text-gray-500 font-mono mt-2">A/c: **** {acc.accountNumber.slice(-4)}</p>
              <p className="text-lg font-black mt-1 font-mono text-gray-900">₹{acc.currentBalance.toLocaleString("en-IN")}</p>
            </div>
          ))}
          {(() => {
            const cashAccount = accounts.find(acc => acc.accountNumber === "CASH-DRAWER");
            const cashBalance = cashAccount ? cashAccount.currentBalance : (metrics.cashInHand || 0);
            return (
              <div className="pr-4 border-r border-gray-300 last:border-r-0">
                <p className="font-black text-sm uppercase text-emerald-600 tracking-tight">CASH IN HAND</p>
                <p className="text-[10px] text-gray-600 font-bold mt-0.5">Dukaan Cash Drawer</p>
                <p className="text-[9px] text-gray-500 font-mono mt-2">Galla / Cash Counter</p>
                <p className="text-lg font-black mt-1 font-mono text-emerald-600">₹{cashBalance.toLocaleString("en-IN")}</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ========================================= */}
      {/* PIPELINE CHEQUE MONITORING CARDS */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 print:hidden">
        <div
          onClick={() => setActiveFilter(activeFilter === "PendingCheque" ? "All" : "PendingCheque")}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            activeFilter === "PendingCheque" ? "border-amber-500 ring-1 ring-amber-500 bg-amber-500/5" : cardBg
          }`}
        >
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Cheques Received (Pending Clear)</span>
            <h3 className="text-2xl font-black mt-1 text-emerald-500">{metrics.pendingChequesReceived} Cheques</h3>
            <p className={`text-xs mt-1 ${textMuted}`}>Incoming pipeline clearance</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter(activeFilter === "PendingCheque" ? "All" : "PendingCheque")}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
            activeFilter === "PendingCheque" ? "border-amber-500 ring-1 ring-amber-500 bg-amber-500/5" : cardBg
          }`}
        >
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Cheques Issued (Pending Clear)</span>
            <h3 className="text-2xl font-black mt-1 text-red-500">{metrics.pendingChequesIssued} Cheques</h3>
            <p className={`text-xs mt-1 ${textMuted}`}>Outgoing bank payments pipeline</p>
          </div>
          <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SECTION 2: REAL-TIME PASSBOOK STATEMENT */}
      {/* ========================================= */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${cardBg}`}>
        {/* Explicitly dark background in dark mode for table header block */}
        <div className={`p-5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${themeMode === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <div>
            <h3 className="font-black text-lg">Passbook Statement Logs</h3>
            <p className={`text-xs ${textMuted}`}>Auto-sync entries from billing checkout, suppliers, and expenses.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto print:hidden">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className={textMuted} />
              </div>
              <input
                type="text"
                placeholder="Search by party, ref or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-${primaryColor}-500 ${inputBg}`}
              />
            </div>

            <div className="flex gap-1 bg-gray-150 dark:bg-gray-850 p-1 rounded-xl">
              {["All", "Deposits", "Withdrawals", "PendingCheque"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeFilter === filter
                      ? `bg-${primaryColor}-600 text-white`
                      : `text-gray-400 hover:text-white`
                  }`}
                >
                  {filter === "PendingCheque" ? "Cheques (Pending)" : filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left border-collapse ${themeMode === "dark" ? "text-gray-200" : "text-gray-800"}`}>
            <thead>
              <tr className={`${tableHeaderBg} text-xs font-bold uppercase border-b border-gray-200 dark:border-gray-700`}>
                <th className="p-4">Date</th>
                <th className="p-4">Bank Account</th>
                <th className="p-4">Party/Description</th>
                <th className="p-4">Method/Ref</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right text-red-500">Debit (Withdrawal)</th>
                <th className="p-4 text-right text-emerald-500">Credit (Deposit)</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`p-8 text-center ${textMuted}`}>
                    Koi transaction log nahi mila.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isDeposit = t.type === "Deposit";
                  const statusColors = {
                    None: themeMode === "dark" ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-gray-150 text-gray-800 border-gray-200",
                    Pending: themeMode === "dark" ? "bg-amber-950/30 text-amber-400 border-amber-900/50" : "bg-amber-50 text-amber-700 border-amber-100",
                    Cleared: themeMode === "dark" ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-700 border-emerald-100",
                    Bounced: themeMode === "dark" ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-700 border-red-100",
                  };

                  return (
                    <tr
                      key={t._id}
                      className={`border-b ${rowHover}`}
                    >
                      <td className={`p-4 font-semibold font-mono text-xs whitespace-nowrap ${themeMode === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className={textMuted} />
                          {t.date}
                        </span>
                      </td>
                      <td className={`p-4 font-bold text-xs ${themeMode === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                        {t.accountId ? t.accountId.accountName : "---"}
                      </td>
                      <td className="p-4">
                        <div className={`font-bold ${themeMode === "dark" ? "text-white" : "text-gray-900"}`}>{t.partyName}</div>
                        <div className={`text-[10px] ${textMuted}`}>{t.description}</div>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold text-xs ${themeMode === "dark" ? "text-gray-200" : "text-gray-800"}`}>{t.method}</span>
                        {t.referenceNumber && (
                          <div className={`text-[10px] ${textMuted} font-mono`}>Ref: {t.referenceNumber}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[t.chequeStatus] || statusColors.None}`}>
                          {t.chequeStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold font-mono text-red-500">
                        {!isDeposit ? `-₹${t.amount.toLocaleString("en-IN")}` : "---"}
                      </td>
                      <td className="p-4 text-right font-black font-mono text-emerald-500">
                        {isDeposit ? `+₹${t.amount.toLocaleString("en-IN")}` : "---"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* SHOP KEEPER TRANSACTION MODAL POPUP */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className={`w-full max-w-lg sm:max-w-xl p-8 rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
            <h3 className="text-xl font-black mb-4 flex items-center gap-1.5">
              💰 {transactionType === "Transfer" ? "Khata Transfer -> Fund Transfer Entry" : `Shop Counter -> ${transactionType === "Deposit" ? "Jama (Deposit) Entry" : "Nikalein (Withdrawal) Entry"}`}
            </h3>

            {/* Segmented Transaction Type Control Toggle */}
            <div className="grid grid-cols-3 gap-1 bg-gray-150 dark:bg-gray-900/60 p-1 rounded-xl mb-5">
              {["Deposit", "Withdrawal", "Transfer"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setTransactionType(type);
                    setFormData((prev) => ({
                      ...prev,
                      description: type === "Transfer" 
                        ? "Inter-Bank/Galla Fund Transfer" 
                        : (type === "Deposit" ? "Shop Cash Deposit (Galla -> Bank)" : "Shop Cash Withdrawal (Bank -> Galla)"),
                      method: type === "Transfer" ? "UPI" : "Cash",
                      transferTargetAccountId: type === "Transfer" && accounts.length > 1 ? (accounts[1]._id !== "CASH-DRAWER" ? accounts[1]._id : accounts[0]._id) : "",
                      chequeStatus: "None",
                    }));
                  }}
                  className={`py-2.5 px-1 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer text-center whitespace-nowrap ${
                    transactionType === type
                      ? `bg-${primaryColor}-600 text-white shadow-sm`
                      : `${textMuted} hover:text-white`
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {type === "Deposit" && <ArrowDownCircle size={14} />}
                    {type === "Withdrawal" && <ArrowUpCircle size={14} />}
                    {type === "Transfer" && <ArrowLeftRight size={14} />}
                    {type === "Deposit" ? "Jama (Deposit)" : type === "Withdrawal" ? "Nikalein (Withdraw)" : "Transfer"}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={handleBankAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Paisa (Amount in ₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                  required
                />
              </div>

              {transactionType === "Transfer" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Select Source Account (Debit From)</label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value, transferTargetAccountId: "" })}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                      required
                    >
                      <option value="" disabled>-- Select Source Account --</option>
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.bankName} - {acc.accountName} (₹{acc.currentBalance.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Select Target Account (Credit To)</label>
                    <select
                      value={formData.transferTargetAccountId}
                      onChange={(e) => setFormData({ ...formData, transferTargetAccountId: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                      required
                    >
                      <option value="" disabled>-- Select Target Account --</option>
                      {accounts.filter(acc => acc._id !== formData.accountId).map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.bankName} - {acc.accountName} (₹{acc.currentBalance.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Transfer Purpose / Narration</label>
                    <input
                      type="text"
                      placeholder="e.g. Galla se HDFC Bank me cash transfer kiya"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Transfer Method</label>
                    <select
                      value={formData.method}
                      onChange={(e) => {
                        const m = e.target.value;
                        setFormData({ 
                          ...formData, 
                          method: m,
                          chequeStatus: m === "Cheque" ? "Pending" : "None"
                        });
                      }}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                    >
                      <option value="Cash">💵 Cash (Galla Transfer)</option>
                      <option value="UPI">📱 Net Banking / UPI</option>
                      <option value="Cheque">✍️ Cheque Transfer</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Select Bank / Cash Account</label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                      required
                    >
                      <option value="" disabled>-- Select Bank Account --</option>
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.bankName} - {acc.accountName} (₹{acc.currentBalance.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Transaction Purpose / Narration Preset</label>
                    <select
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                    >
                      {transactionType === "Deposit" ? (
                        <>
                          <option value="Shop Cash Deposit (Galla -> Bank)">💵 Shop Cash Deposit (Galla -&gt; Bank)</option>
                          <option value="Owner Capital Investment">📈 Owner Capital Investment (Direct Capital Addition)</option>
                        </>
                      ) : (
                        <>
                          <option value="Shop Cash Withdrawal (Bank -> Galla)">💵 Shop Cash Withdrawal (Bank -&gt; Galla)</option>
                          <option value="Owner Personal Withdrawal (Drawings)">📉 Owner Personal Withdrawal (Drawings)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">Transaction Method</label>
                    <select
                      value={formData.method}
                      onChange={(e) => {
                        const m = e.target.value;
                        setFormData({ 
                          ...formData, 
                          method: m,
                          chequeStatus: m === "Cheque" ? "Pending" : "None"
                        });
                      }}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                    >
                      <option value="Cash">💵 Cash (Galla Transaction)</option>
                      <option value="Cheque">✍️ Cheque Book</option>
                      <option value="UPI">📱 Net Banking / UPI</option>
                    </select>
                  </div>
                </>
              )}

              {formData.method !== "Cash" && (
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Cheque / Ref Number</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ002341 ya UPI ID"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Transaction Status</label>
                <select
                  value={formData.chequeStatus}
                  onChange={(e) => setFormData({ ...formData, chequeStatus: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${inputBg}`}
                >
                  <option value="None">None (Instantly Completed)</option>
                  <option value="Pending">Pending (Awaiting clearance)</option>
                  <option value="Cleared">Cleared (Successfully processed)</option>
                  <option value="Bounced">Bounced (Failed/Cancelled)</option>
                </select>
              </div>

              {/* Action Triggers */}
              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`w-1/2 py-2.5 font-bold rounded-xl border cursor-pointer ${
                    themeMode === "dark" ? "border-gray-600 hover:bg-gray-700 text-white" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`w-1/2 py-2.5 text-white font-bold rounded-xl shadow-md cursor-pointer ${
                    transactionType === "Transfer"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : (transactionType === "Deposit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")
                  }`}
                >
                  {transactionType === "Transfer" ? "Complete Transfer" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: LINK BANK ACCOUNT FORM */}
      {/* ========================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${cardBg}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-750">
              <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
                <Landmark size={20} /> Link New Bank Account
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`p-2 rounded-full transition-colors ${themeMode === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Account Holder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SmartInvoice Current A/c"
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank"
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="14-digit Account No"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-gray-400">IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0000124"
                    value={newAccount.ifscCode}
                    onChange={(e) => setNewAccount({ ...newAccount, ifscCode: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Opening Balance (₹)</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}>
                    <IndianRupee size={16} />
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={newAccount.currentBalance}
                    onChange={(e) => setNewAccount({ ...newAccount, currentBalance: e.target.value })}
                    className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    themeMode === "dark" ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-gray-150 text-gray-750 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold text-white bg-${primaryColor}-600 hover:bg-${primaryColor}-700 shadow-md`}
                >
                  Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================= */}
      {/* MODAL: EDIT BANK ACCOUNT FORM */}
      {/* ========================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${cardBg}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-750">
              <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
                <Landmark size={20} /> Edit Bank Account Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className={`p-2 rounded-full transition-colors ${themeMode === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Account Holder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SmartInvoice Current A/c"
                  value={editAccount.accountName}
                  onChange={(e) => setEditAccount({ ...editAccount, accountName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank"
                  value={editAccount.bankName}
                  onChange={(e) => setEditAccount({ ...editAccount, bankName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="14-digit Account No"
                    value={editAccount.accountNumber}
                    onChange={(e) => setEditAccount({ ...editAccount, accountNumber: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase text-gray-400">IFSC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0000124"
                    value={editAccount.ifscCode}
                    onChange={(e) => setEditAccount({ ...editAccount, ifscCode: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-gray-400">Current Balance (₹)</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}>
                    <IndianRupee size={16} />
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={editAccount.currentBalance}
                    onChange={(e) => setEditAccount({ ...editAccount, currentBalance: e.target.value })}
                    className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    themeMode === "dark" ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-gray-150 text-gray-750 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold text-white bg-${primaryColor}-600 hover:bg-${primaryColor}-700 shadow-md cursor-pointer`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankingDashboard;
