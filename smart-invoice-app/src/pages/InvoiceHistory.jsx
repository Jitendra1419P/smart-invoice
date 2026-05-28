import { useState, useEffect } from 'react';
import useSettingsStore from '../store/settingsStore';
import * as api from '../api';
import { translations } from '../data/translations';
import {
    FileText,
    Search,
    Printer,
    MessageCircle,
    Trash2,
    X,
    IndianRupee,
    Calendar,
    Eye,
    TrendingUp,
    Receipt,
    FileSpreadsheet,
    Filter,
} from 'lucide-react';

const InvoiceHistory = () => {
    const { 
        themeMode, 
        primaryColor, 
        businessName, 
        logoUrl, 
        printerSize,
        cin,
        gstin,
        shopAddress,
        website,
        supportEmail,
        supportPhone,
        fssai,
        taxRate,
        language
    } = useSettingsStore();

    const t = translations[language || "en"] || translations.en;

    const getDeterministicDetails = (name) => {
        const cleanName = name || "SmartInvoice";
        const lowerName = cleanName.toLowerCase();
        
        const defaults = {
            cin: "U74120MH2014PLC259234",
            gstin: "27AANCA0090J1ZK",
            fssai: "11516013000245",
            fssaiCustomer: "11519002000008",
            address: "Building No 2, Mansukh Industrial Estate, Off Kanjur Village Road, Opp Mumbai, Maharashtra, INDIA - 400042",
            pickupAddress: "Elly Kadoorie School, Tadwadi - Mazgaon\nShop No. 24/A, 24/B & 24/C, Sir Elly Kadoorie School\nCompound, Shivdas Champsi Marg, Near Chaitya Temple, Tadwadi,\nMazgaon, Opp. Laxmi Vilas Hotel, Mumbai, Maharashtra - 400010"
        };

        if (lowerName.includes("avenue") || lowerName.includes("dmart") || lowerName === "smartinvoice") {
            return {
                cin: cin || defaults.cin,
                gstin: gstin || defaults.gstin,
                fssai: fssai || defaults.fssai,
                fssaiCustomer: defaults.fssaiCustomer,
                address: shopAddress || defaults.address,
                pickupAddress: defaults.pickupAddress
            };
        }
        
        // Deterministic hash based on name
        let hash = 0;
        for (let i = 0; i < cleanName.length; i++) {
            hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const posHash = Math.abs(hash);
        const cinCode = String(100000 + (posHash % 900000));
        const gstinCode = String(1000 + (posHash % 9000));
        const fssaiCode = "11516" + String(100000000 + (posHash % 900000000));
        const fssaiCustomerCode = "11519" + String(100000000 + (posHash % 900000000));
        
        return {
            cin: cin || `U74120MH2014PLC${cinCode}`,
            gstin: gstin || `27AANCA${gstinCode}J1ZK`,
            fssai: fssai || fssaiCode,
            fssaiCustomer: fssaiCustomerCode,
            address: shopAddress || `${cleanName} Ltd., Phase-${(posHash % 3) + 1}, Industrial Area, Mumbai, INDIA - 400001`,
            pickupAddress: `${cleanName} Store, Main Road Landmark, Near City Center, Mumbai, Maharashtra - 400001`
        };
    };

    // States
    const [invoices, setInvoices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    // Advanced Filter States
    const [dateFilter, setDateFilter] = useState('All'); // All, Today, Yesterday, 7days, month, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    // Strict Theme Colors (100% Dark Mode Safe)
    const bgMain =
        themeMode === 'dark'
            ? 'bg-gray-900 text-white'
            : 'bg-gray-50 text-gray-900';
    const cardBg =
        themeMode === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200';
    const textMuted = themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const inputBg =
        themeMode === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-gray-50 border-gray-300 text-black';
    const rowHover =
        themeMode === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50';

    // Load Invoices from Database
    const loadInvoices = async () => {
        try {
            const data = await api.getInvoices();
            setInvoices(data);
        } catch (err) {
            console.error('Error loading invoices from backend:', err);
            // Hardcoded fallback mock data for testing
            setInvoices([
                {
                    _id: 'mock-1',
                    invoiceNumber: 'SI-00001',
                    customerName: 'Amit Sharma',
                    customerPhone: '8898960995',
                    cart: [
                        {
                            name: 'Fortune Sunflower Oil 1L',
                            qty: 2,
                            salePrice: 145,
                        },
                        { name: 'Aashirvaad Atta 5kg', qty: 1, salePrice: 210 },
                    ],
                    subTotal: 500,
                    tax: 25,
                    discount: 50,
                    grandTotal: 475,
                    createdAt: new Date(
                        Date.now() - 24 * 60 * 60 * 1000 * 2,
                    ).toISOString(),
                },
                {
                    _id: 'mock-2',
                    invoiceNumber: 'SI-00002',
                    customerName: 'Sunil Verma',
                    customerPhone: '9123456789',
                    cart: [
                        { name: 'Amul Butter 100g', qty: 1, salePrice: 56 },
                        { name: 'Tata Salt 1kg', qty: 2, salePrice: 24 },
                    ],
                    subTotal: 104,
                    tax: 5.2,
                    discount: 0,
                    grandTotal: 109,
                    createdAt: new Date().toISOString(),
                },
            ]);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    // Advanced Filtering Logic
    const filteredInvoices = invoices.filter((inv) => {
        // 1. Search Term Filter
        const matchesSearch =
            inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.customerPhone && inv.customerPhone.includes(searchTerm));

        // 2. Date Filter
        let matchesDate = true;
        const invDate = new Date(inv.createdAt || inv.date);
        
        // Normalize dates to start of day for comparison
        const getStartOfDay = (d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date;
        };
        
        const today = getStartOfDay(new Date());
        const invDay = getStartOfDay(invDate);

        // Helper to parse input date string in local timezone (avoiding UTC timezone shift)
        const parseLocalInputDate = (dateStr) => {
            if (!dateStr) return null;
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        };

        if (dateFilter === 'Today') {
            matchesDate = invDay.getTime() === today.getTime();
        } else if (dateFilter === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = invDay.getTime() === yesterday.getTime();
        } else if (dateFilter === '7days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            matchesDate = invDay >= sevenDaysAgo;
        } else if (dateFilter === 'month') {
            const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            matchesDate = invDay >= firstOfThisMonth;
        } else if (dateFilter === 'custom') {
            if (startDate) {
                const start = parseLocalInputDate(startDate);
                matchesDate = matchesDate && invDay >= start;
            }
            if (endDate) {
                const end = parseLocalInputDate(endDate);
                matchesDate = matchesDate && invDay <= end;
            }
        }

        // 3. Amount Filter
        let matchesAmount = true;
        if (minAmount !== '') {
            matchesAmount = matchesAmount && inv.grandTotal >= Number(minAmount);
        }
        if (maxAmount !== '') {
            matchesAmount = matchesAmount && inv.grandTotal <= Number(maxAmount);
        }

        return matchesSearch && matchesDate && matchesAmount;
    });

    // Stats Calculations based on currently filtered invoices
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const averageBill =
        filteredInvoices.length > 0 ? Math.round(totalSales / filteredInvoices.length) : 0;

    // View Receipt Details
    const handleOpenInvoice = (inv) => {
        setSelectedInvoice(inv);
        setIsViewModalOpen(true);
    };

    // Reprint / Print Trigger from Modal
    const handleReprint = (inv) => {
        const originalTitle = document.title;
        const cleanCustomerName = (inv.customerName || 'Customer').replace(
            /[^a-zA-Z0-9]/g,
            '_',
        );
        document.title = `${inv.invoiceNumber}_${cleanCustomerName}`;

        // Dynamically write print receipt content to temporary styling
        const style = document.createElement('style');
        style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-area-modal, #print-area-modal * {
          visibility: visible;
        }
        #print-area-modal {
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

    // Delete Invoice Record
    const handleDeleteInvoice = async (id) => {
        if (
            window.confirm(
                'Kya aap is Invoice record ko cancel/delete karna chahte hain?',
            )
        ) {
            try {
                await api.deleteInvoice(id);
                setInvoices(invoices.filter((inv) => inv._id !== id));
            } catch (err) {
                console.error('Delete invoice failed', err);
                alert('Invoice hatane mein problem aayi, kripya check karein.');
            }
        }
    };

    // WhatsApp Re-share
    const handleWhatsAppReShare = (inv) => {
        if (
            !inv.customerPhone ||
            inv.customerPhone === 'N/A' ||
            inv.customerPhone.replace(/\D/g, '').length !== 10
        ) {
            alert('Invalid customer phone number for WhatsApp!');
            return;
        }

        const cleanPhone = inv.customerPhone.replace(/\D/g, '');
        let message = `*Dear ${inv.customerName || 'Customer'},*\n\n`;
        message += `*🧾 ${businessName || 'SmartInvoice'} - Bill Receipt*\n`;
        message += `Invoice No: *${inv.invoiceNumber}*\n`;
        message += `---------------------------------------\n`;
        message += `Date: ${new Date(inv.createdAt).toLocaleString()}\n\n`;
        message += `*Items:*\n`;

        inv.cart.forEach((item) => {
            message += `- ${item.name} (Qty: ${item.qty}) - ₹${item.salePrice * item.qty}\n`;
        });

        const invTaxRate = inv.subTotal > 0 ? Math.round((inv.tax / inv.subTotal) * 100) : taxRate;
        const invDiscountPercent = inv.subTotal > 0 ? Math.round((inv.discount / inv.subTotal) * 100) : 0;

        message += `\n*Summary:*\n`;
        message += `Subtotal: ₹${inv.subTotal.toFixed(2)}\n`;
        message += `Tax (${invTaxRate}%): ₹${inv.tax.toFixed(2)}\n`;
        if (inv.discount > 0) {
            message += `Discount (${invDiscountPercent}%): ₹${inv.discount.toFixed(2)}\n`;
        }
        message += `---------------------------------------\n`;
        message += `*Total Paid: ₹${inv.grandTotal}*\n\n`;
        message += `Thank you for shopping with us! 🙏`;

        const encodedText = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedText}`;
        window.open(whatsappUrl, '_blank');
    };

    const isA4 = printerSize === 'A4';
    const printWidth = isA4
        ? '100%'
        : printerSize === '80mm Thermal'
          ? '300px'
          : '220px';
    const printFontSize = isA4 ? 'text-sm' : 'text-[11px]';

    return (
        <div className={`min-h-screen p-6 lg:p-8 ${bgMain}`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FileText
                            size={32}
                            className={`text-${primaryColor}-500`}
                        />
                        {t.salesLedgerTitle}
                    </h1>
                    <p className={`mt-1 ${textMuted}`}>
                        {t.salesLedgerSubtitle}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
                <div
                    className={`p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-2 md:gap-4 ${cardBg}`}
                >
                    <div
                        className={`p-2.5 md:p-4 rounded-xl flex-shrink-0 ${themeMode === "dark" ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}
                    >
                        <TrendingUp className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                        <p
                            className={`text-[9px] md:text-xs font-semibold uppercase tracking-wide truncate ${textMuted}`}
                        >
                            {t.totalRevenue}
                        </p>
                        <h3 className="text-sm md:text-3xl font-bold mt-0.5 md:mt-1 text-emerald-500 flex items-center justify-center sm:justify-start">
                            <IndianRupee className="w-3.5 h-3.5 md:w-6 md:h-6 mr-0.5" />
                            {totalSales.toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>

                <div
                    className={`p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-2 md:gap-4 ${cardBg}`}
                >
                    <div
                        className={`p-2.5 md:p-4 rounded-xl flex-shrink-0 ${themeMode === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}
                    >
                        <Receipt className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                        <p
                            className={`text-[9px] md:text-xs font-semibold uppercase tracking-wide truncate ${textMuted}`}
                        >
                            {t.totalBills}
                        </p>
                        <h3 className="text-sm md:text-3xl font-bold mt-0.5 md:mt-1 text-blue-500 truncate">
                            {invoices.length} {t.totalBills.split(' ')[1] || 'Bills'}
                        </h3>
                    </div>
                </div>

                <div
                    className={`p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-2 md:gap-4 ${cardBg}`}
                >
                    <div
                        className={`p-2.5 md:p-4 rounded-xl flex-shrink-0 ${themeMode === "dark" ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"}`}
                    >
                        <FileSpreadsheet className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-center sm:text-left min-w-0">
                        <p
                            className={`text-[9px] md:text-xs font-semibold uppercase tracking-wide truncate ${textMuted}`}
                        >
                            {t.averageInvoice}
                        </p>
                        <h3 className="text-sm md:text-3xl font-bold mt-0.5 md:mt-1 text-purple-500 flex items-center justify-center sm:justify-start">
                            <IndianRupee className="w-3.5 h-3.5 md:w-6 md:h-6 mr-0.5" />
                            {averageBill.toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Search and Advanced Filters */}
            <div
                className={`p-6 rounded-2xl border shadow-sm mb-6 ${cardBg}`}
            >
                <div className="flex flex-col gap-6">
                    {/* Top Row: Search & Action buttons */}
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={20} className={textMuted} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by Bill No, Name, or Phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all ${inputBg}`}
                                style={{
                                    borderColor: `var(--color-${primaryColor}-500)`,
                                }}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setDateFilter('All');
                                    setStartDate('');
                                    setEndDate('');
                                    setMinAmount('');
                                    setMaxAmount('');
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border hover:scale-[1.02] cursor-pointer ${
                                    themeMode === 'dark'
                                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Reset Filters
                            </button>
                            <span className={`text-xs font-bold ${textMuted} whitespace-nowrap`}>
                                Showing {filteredInvoices.length} of {invoices.length} Bills
                            </span>
                        </div>
                    </div>

                    {/* Middle Row: Date Quick Presets */}
                    <div className="flex flex-col gap-3">
                        <label className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>
                            Filter by Date Preset
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'All', label: 'All Time' },
                                { key: 'Today', label: 'Today (Aaj)' },
                                { key: 'Yesterday', label: 'Yesterday (Kal)' },
                                { key: '7days', label: 'Last 7 Days' },
                                { key: 'month', label: 'This Month' },
                                { key: 'custom', label: 'Custom Range 📅' },
                            ].map((preset) => {
                                const isActive = dateFilter === preset.key;
                                return (
                                    <button
                                        key={preset.key}
                                        onClick={() => setDateFilter(preset.key)}
                                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 hover:-translate-y-0.5 cursor-pointer ${
                                            isActive
                                                ? `bg-${primaryColor}-600 text-white shadow-md`
                                                : themeMode === 'dark'
                                                ? 'bg-gray-750 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Collapsible Row: Custom Date Range & Amount Ranges */}
                    <div 
                        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border ${
                            themeMode === 'dark' ? 'bg-gray-900/40 border-gray-700' : 'bg-gray-50 border-gray-200'
                        } transition-all duration-300 ${
                            dateFilter === 'custom' || minAmount || maxAmount ? 'opacity-100 block' : 'opacity-100'
                        }`}
                    >
                        {/* Custom Start Date */}
                        <div className={`${dateFilter === 'custom' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                disabled={dateFilter !== 'custom'}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-all ${inputBg}`}
                            />
                        </div>

                        {/* Custom End Date */}
                        <div className={`${dateFilter === 'custom' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                disabled={dateFilter !== 'custom'}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-all ${inputBg}`}
                            />
                        </div>

                        {/* Min Amount */}
                        <div>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
                                Min Bill Amount (₹)
                            </label>
                            <input
                                type="number"
                                placeholder="Min ₹"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-all ${inputBg}`}
                            />
                        </div>

                        {/* Max Amount */}
                        <div>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
                                Max Bill Amount (₹)
                            </label>
                            <input
                                type="number"
                                placeholder="Max ₹"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none transition-all ${inputBg}`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices List Table */}
            <div
                className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr
                                className={`border-b ${themeMode === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}
                            >
                                <th className="p-4 font-semibold text-sm">
                                    Invoice Details
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Customer Details
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Items Count
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Total Sale Value
                                </th>
                                <th className="p-4 font-semibold text-sm text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className={`p-8 text-center ${textMuted}`}
                                    >
                                        Koi bill history nahi mili.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr
                                        key={inv._id}
                                        className={`border-b transition-colors duration-150 ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-100'} ${rowHover}`}
                                    >
                                        <td className="p-4">
                                            <div>
                                                <span
                                                    className={`font-black text-sm text-${primaryColor}-500`}
                                                >
                                                    {inv.invoiceNumber}
                                                </span>
                                                <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(
                                                        inv.createdAt ||
                                                            inv.date,
                                                    ).toLocaleDateString(
                                                        'en-IN',
                                                        {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <div className="font-bold text-sm">
                                                    {inv.customerName}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {inv.customerPhone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${themeMode === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                                                {inv.cart
                                                    ? inv.cart.reduce(
                                                          (sum, item) =>
                                                              sum + item.qty,
                                                          0,
                                                      )
                                                    : 0}{' '}
                                                items
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-extrabold text-base flex items-center text-emerald-500">
                                                <IndianRupee size={16} />
                                                {inv.grandTotal.toLocaleString(
                                                    'en-IN',
                                                )}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center justify-center gap-3 w-full">
                                                {/* 1. View / Reprint Receipt */}
                                                <button
                                                    onClick={() =>
                                                        handleOpenInvoice(inv)
                                                    }
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors h-9 cursor-pointer border ${
                                                        themeMode === 'dark'
                                                            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                                                            : 'bg-white border-gray-200 text-black hover:bg-gray-50'
                                                    }`}
                                                    title="View / Reprint Invoice Receipt"
                                                >
                                                    <Eye size={14} /> View Bill
                                                </button>

                                                {/* 2. WhatsApp Share */}
                                                <button
                                                    onClick={() => {
                                                        if (inv.customerPhone && inv.customerPhone !== 'N/A') {
                                                            handleWhatsAppReShare(inv);
                                                        }
                                                    }}
                                                    disabled={!inv.customerPhone || inv.customerPhone === 'N/A'}
                                                    className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                                        !inv.customerPhone || inv.customerPhone === 'N/A'
                                                            ? (themeMode === 'dark' ? 'opacity-40 cursor-not-allowed border-gray-700 text-gray-500' : 'opacity-40 cursor-not-allowed border-gray-300 text-gray-400')
                                                            : themeMode === 'dark'
                                                            ? 'border-green-800 text-green-400 hover:bg-green-950/50'
                                                            : 'border-green-200 text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={!inv.customerPhone || inv.customerPhone === 'N/A' ? "No valid phone number for WhatsApp" : "Re-share Invoice on WhatsApp"}
                                                >
                                                    <MessageCircle size={16} />
                                                </button>

                                                {/* 3. Delete / Cancel Invoice */}
                                                <button
                                                    onClick={() =>
                                                        handleDeleteInvoice(
                                                            inv._id,
                                                        )
                                                    }
                                                    className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                                        themeMode === 'dark'
                                                            ? 'border-red-900 text-red-400 hover:bg-red-950/50'
                                                            : 'border-red-200 text-red-600 hover:bg-red-50'
                                                    }`}
                                                    title="Delete Invoice Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW RECEIPT MODAL */}
            {isViewModalOpen && selectedInvoice && (() => {
                const biz = getDeterministicDetails(businessName);
                const orderDate = new Date(selectedInvoice.createdAt || selectedInvoice.date);
                const deliveryDate = new Date(orderDate);
                deliveryDate.setDate(deliveryDate.getDate() + 1);
                
                const invoiceTaxRate = selectedInvoice.subTotal > 0 ? Math.round((selectedInvoice.tax / selectedInvoice.subTotal) * 100) : taxRate;
                const cgstRate = (invoiceTaxRate / 2).toFixed(2);
                const sgstRate = (invoiceTaxRate / 2).toFixed(2);
                const taxDivisor = 1 + invoiceTaxRate / 100;
                
                const orderDateStr = orderDate.toLocaleDateString('en-GB');
                const deliveryDateStr = deliveryDate.toLocaleDateString('en-GB');
                const deliveryDayName = deliveryDate.toLocaleDateString('en-US', { weekday: 'long' });

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
                        <div
                            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${themeMode === 'dark' ? 'bg-gray-850 text-white border border-gray-700' : 'bg-white text-gray-900'}`}
                        >
                            <div
                                className={`flex justify-between items-center p-4 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                            >
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    <Receipt
                                        size={18}
                                        className={`text-${primaryColor}-500`}
                                    />
                                    Reprint Bill Receipt
                                </h2>
                                <button
                                    onClick={() => setIsViewModalOpen(false)}
                                    className={`p-1.5 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Receipt Modal Body */}
                             <div className={`flex-1 overflow-y-auto p-4 flex justify-center ${themeMode === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
                                {/* Receipt Visual Body */}
                                <div
                                    id="print-area-modal"
                                    className="bg-white text-black p-4 font-mono w-full text-[11px] leading-tight border border-gray-200 shadow-md animate-fade-in"
                                    style={{ width: "100%", maxWidth: "380px", margin: "0 auto" }}
                                >
                                    {/* Stylized custom logo or dynamic business name */}
                                    <div className="text-center mb-1">
                                        {logoUrl ? (
                                            <div className="flex justify-center mb-1.5">
                                                <img src={logoUrl} alt="Logo" className="h-10 max-w-[200px] object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex justify-center items-center gap-0.5 font-sans mb-1">
                                                <span className="text-2xl font-black tracking-tighter text-gray-950">S</span>
                                                <span className="text-xl text-emerald-600 font-serif relative" style={{ top: "-2px" }}>★</span>
                                                <span className="text-2xl font-bold tracking-tighter text-gray-900 mr-1.5" style={{ fontFamily: "Georgia, Georgia, serif" }}>mart</span>
                                                <span className="text-lg font-black tracking-tight text-emerald-600 italic font-serif" style={{ fontFamily: "'Brush Script MT', cursive, Georgia, sans-serif" }}>Invoice</span>
                                            </div>
                                        )}
                                        <h2 className="font-bold text-xs tracking-tight uppercase text-gray-950 mt-1">
                                            {businessName || "SmartInvoice"}
                                        </h2>
                                        <p className="text-[9px] font-bold text-gray-700 mt-0.5">CIN: {biz.cin}</p>
                                        <p className="text-[9px] font-bold text-gray-700">GSTIN: {biz.gstin}</p>
                                    </div>

                                    <div className="border-t border-dashed border-black my-2"></div>
                                    <div className="text-center font-bold text-[11px] mb-1">TAX INVOICE</div>
                                    <div className="space-y-0.5 text-gray-800">
                                        <p>Invoice No: {selectedInvoice.invoiceNumber}</p>
                                        <p>Invoice Date: {orderDateStr}</p>
                                    </div>
                                    <div className="border-t border-dashed border-black my-2"></div>

                                    {/* 2. Main Product Table (Items Details) */}
                                    <div className="mb-2">
                                        <table className="w-full text-left border-collapse text-[11px] font-mono leading-tight">
                                            <thead>
                                                <tr className="border-b border-black border-dashed font-bold">
                                                    <th className="pb-1">HSN</th>
                                                    <th className="pb-1">Particulars</th>
                                                    <th className="pb-1 text-center">Qty</th>
                                                    <th className="pb-1 text-right">Rate</th>
                                                    <th className="pb-1 text-right">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Output tax category header */}
                                                <tr className="font-bold text-[10px]">
                                                    <td colSpan="5" className="pt-2">2 CGST@ {cgstRate}% SGST@ {sgstRate}%</td>
                                                </tr>
                                                {selectedInvoice.cart.map((item, idx) => {
                                                    const rate = item.salePrice || item.price;
                                                    const value = rate * item.qty;
                                                    const hsnCode = `1904${idx}0`;
                                                    return (
                                                        <tr key={idx} className="align-top">
                                                            <td className="py-1 text-gray-800">{hsnCode}</td>
                                                            <td className="py-1 pr-1 font-bold">{item.name}</td>
                                                            <td className="py-1 text-center font-bold">{item.qty}</td>
                                                            <td className="py-1 text-right">{rate.toFixed(2)}</td>
                                                            <td className="py-1 text-right font-bold">{value.toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Product Summary Row */}
                                        <div className="border-t border-b border-black border-dashed py-1.5 my-2 flex justify-between font-black text-xs font-mono">
                                            <span>Items:{selectedInvoice.cart.length}</span>
                                            <span>Qty:{selectedInvoice.cart.reduce((sum, i) => sum + i.qty, 0)}</span>
                                            <span>Amt: {selectedInvoice.grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* 3. Savings & Tax Breakup Table */}
                                    <div className="my-3 text-center">
                                        <h4 className="text-xs font-black text-gray-950 tracking-tight uppercase">
                                            YOUR SAVINGS: ₹{Number(selectedInvoice.discount).toFixed(2)} (on MRP)
                                        </h4>
                                    </div>
                                    
                                    <div className="border-t border-dashed border-black my-2"></div>

                                    <div className="font-mono text-[10px] text-gray-800">
                                        <div className="text-center font-bold mb-1.5">
                                            &lt;--- GST Breakup Details ---&gt; (Amount in ₹)
                                        </div>
                                        <table className="w-full text-left border-collapse leading-normal">
                                            <thead>
                                                <tr className="border-b border-black border-dashed font-bold">
                                                    <th>GST IND</th>
                                                    <th className="text-right">Taxable Amt</th>
                                                    <th className="text-right">CGST</th>
                                                    <th className="text-right">SGST</th>
                                                    <th className="text-right">CESS</th>
                                                    <th className="text-right">Total Amt</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="align-middle">
                                                    <td className="py-1 font-bold">2</td>
                                                    <td className="py-1 text-right">{(selectedInvoice.grandTotal / taxDivisor).toFixed(2)}</td>
                                                    <td className="py-1 text-right">{(selectedInvoice.tax / 2).toFixed(2)}</td>
                                                    <td className="py-1 text-right">{(selectedInvoice.tax / 2).toFixed(2)}</td>
                                                    <td className="py-1 text-right">......</td>
                                                    <td className="py-1 text-right font-bold text-black">{selectedInvoice.grandTotal.toFixed(2)}</td>
                                                </tr>
                                                <tr className="border-t border-black border-dashed font-black text-black">
                                                    <td className="py-1">T</td>
                                                    <td className="py-1 text-right">{(selectedInvoice.grandTotal / taxDivisor).toFixed(2)}</td>
                                                    <td className="py-1 text-right">{(selectedInvoice.tax / 2).toFixed(2)}</td>
                                                    <td className="py-1 text-right">{(selectedInvoice.tax / 2).toFixed(2)}</td>
                                                    <td className="py-1 text-right">......</td>
                                                    <td className="py-1 text-right">{selectedInvoice.grandTotal.toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 4. Order & Delivery Details */}
                                    <div className="border-t border-dashed border-black my-2"></div>
                                    <div className="font-mono text-[10px] space-y-1 text-gray-800">
                                        <div className="text-center font-bold uppercase tracking-wider mb-1 text-black">Order Details</div>
                                        <div className="flex justify-between font-bold">
                                            <span>ORDER NUMBER:{selectedInvoice.invoiceNumber}</span>
                                            <span>ORDER DATE:{orderDateStr}</span>
                                        </div>
                                        <p>DELIVERY DATE:{deliveryDateStr}, {deliveryDayName}</p>
                                        <p>DELIVERY TIME:6:00 PM - 9:00 PM</p>
                                        <p>PAYMENT MODE:CASH ON DELIVERY (COD)</p>
                                    </div>

                                    {/* 5. Customer & PickUp Details */}
                                    <div className="border-t border-dashed border-black my-2"></div>
                                    <div className="font-mono text-[10px] space-y-1 text-gray-800">
                                        <div className="text-center font-bold uppercase tracking-wider mb-1 text-black">Customer & Delivery Details</div>
                                        <p>CUSTOMER NAME:{selectedInvoice.customerName || "One-Time Customer"}</p>
                                        <p>MOBILE NUMBER:{selectedInvoice.customerPhone || "N/A"}</p>
                                        <p>DELIVERY MODE:SELF PICK UP</p>
                                        <p className="font-bold">SELF PICK UP POINT ADDRESS:</p>
                                        <p className="leading-tight pl-2 whitespace-pre-line">
                                            {biz.pickupAddress}
                                        </p>
                                        <p>FSSAI NO:{biz.fssaiCustomer}</p>
                                    </div>

                                    {/* Action Collect Money Block */}
                                    <div className="border-t border-dashed border-black my-2"></div>
                                    <div className="text-center my-3 font-mono text-black">
                                        <h4 className="text-sm font-black uppercase tracking-tight">
                                            PAY ON DELIVERY (Cash Or Card)
                                        </h4>
                                        <p className="text-xs font-bold mt-0.5">
                                            ₹{selectedInvoice.grandTotal.toFixed(2)} to be collected at the time of delivery
                                        </p>
                                    </div>

                                    {/* 6. Footer (Legal & Support) */}
                                    <div className="border-t border-dashed border-black my-2"></div>
                                    <div className="font-mono text-[8px] text-gray-600 leading-normal space-y-1 text-center">
                                        <p className="text-left leading-tight">
                                            For Terms & Conditions as accepted by you while ordering please visit- 
                                            <span className="text-black font-bold">{website ? website : `https://${(businessName || "smartinvoice").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}.in/terms-conditions.html`}</span>
                                        </p>
                                        <p className="text-left">Customer Service Email: <span className="text-black font-bold">{supportEmail ? supportEmail : `customerservice@${(businessName || "smartinvoice").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}.in`}</span></p>
                                        <p className="text-left">Call Customer Service @ <span className="text-black font-bold">{supportPhone || "022-62337171"}</span></p>
                                        <p className="italic font-bold">"This is computer generated invoice."</p>
                                        
                                        <div className="border-t border-black border-dashed my-1.5"></div>
                                        
                                        <p className="font-bold text-black uppercase">{businessName || "SmartInvoice"}</p>
                                        <p className="whitespace-pre-line">{biz.address}</p>
                                        <p className="font-bold text-black">FSSAI NO: {biz.fssai}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reprint Button */}
                            <div
                                className={`p-4 border-t flex justify-end gap-3 ${themeMode === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-150 bg-gray-50'}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsViewModalOpen(false)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold ${themeMode === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReprint(selectedInvoice)}
                                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md bg-${primaryColor}-600 hover:bg-${primaryColor}-700`}
                                >
                                    <Printer size={14} /> Reprint Now
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default InvoiceHistory;
