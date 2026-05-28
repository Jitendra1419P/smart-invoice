import { useState, useEffect } from 'react';
import useSettingsStore from '../store/settingsStore';
// 1. DYNAMIC IMPORT: Data folder se expenses ko import kiya
import { initialExpenses } from '../data/mockData';
import * as api from '../api';

import {
    Wallet,
    Plus,
    Trash2,
    X,
    Search,
    Calendar,
    TrendingUp,
    ArrowUpRight,
    IndianRupee,
    Filter,
    ChevronDown,
    Edit,
    Printer,
    Settings,
} from 'lucide-react';

const Expenses = () => {
    const { themeMode, primaryColor } = useSettingsStore();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Advanced Filter States
    const [dateFilter, setDateFilter] = useState('All'); // All, Today, Yesterday, 7days, month, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    // Dynamic Categories State
    const [categories, setCategories] = useState([
        'Chai-Paani',
        'Rent & Bills',
        'Staff Salary',
        'Others',
    ]);
    const [showCustomCategoryInput, setShowCustomCategoryInput] =
        useState(false);
    const [customCategoryName, setCustomCategoryName] = useState('');

    // Category Manager State
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [newCategoryNameInManager, setNewCategoryNameInManager] =
        useState('');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Chai-Paani',
        date: new Date().toISOString().split('T')[0],
    });

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
            ? `bg-gray-700 border-gray-600 text-white focus:border-${primaryColor}-500`
            : `bg-gray-50 border-gray-300 text-black focus:border-${primaryColor}-500`;
    const rowHover =
        themeMode === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50';

    // 2. Load expenses from backend (fallback to mock data if fetch fails)
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const data = await api.getExpenses();
                if (!mounted) return;
                const mapped = data.map((e) => ({
                    id: e._id || e.id,
                    title: e.description || e.category,
                    amount: e.amount ?? 0,
                    category: e.category ?? 'Other',
                    date: e.date
                        ? new Date(e.date).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0],
                }));
                setExpenses(mapped);
            } catch (err) {
                setExpenses(initialExpenses);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Search and Advanced Filter Logic
    const filteredExpenses = expenses.filter((exp) => {
        // 1. Search filter
        const matchesSearch = exp.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        // 2. Category filter
        const matchesCategory =
            categoryFilter === 'All' || exp.category === categoryFilter;

        // 3. Date filter
        let matchesDate = true;
        const expDate = new Date(exp.date);

        // Normalize dates to start of day for comparison
        const getStartOfDay = (d) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date;
        };

        const today = getStartOfDay(new Date());
        const expDay = getStartOfDay(expDate);

        // Helper to parse input date string in local timezone (avoiding UTC timezone shift)
        const parseLocalInputDate = (dateStr) => {
            if (!dateStr) return null;
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        };

        if (dateFilter === 'Today') {
            matchesDate = expDay.getTime() === today.getTime();
        } else if (dateFilter === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = expDay.getTime() === yesterday.getTime();
        } else if (dateFilter === '7days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            matchesDate = expDay >= sevenDaysAgo;
        } else if (dateFilter === 'month') {
            const firstOfThisMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
            );
            matchesDate = expDay >= firstOfThisMonth;
        } else if (dateFilter === 'custom') {
            if (startDate) {
                const start = parseLocalInputDate(startDate);
                matchesDate = matchesDate && expDay >= start;
            }
            if (endDate) {
                const end = parseLocalInputDate(endDate);
                matchesDate = matchesDate && expDay <= end;
            }
        }

        // 4. Amount filter
        let matchesAmount = true;
        if (minAmount !== '') {
            matchesAmount = matchesAmount && exp.amount >= Number(minAmount);
        }
        if (maxAmount !== '') {
            matchesAmount = matchesAmount && exp.amount <= Number(maxAmount);
        }

        return matchesSearch && matchesCategory && matchesDate && matchesAmount;
    });

    // Math Calculations based on currently filtered expenses
    const totalExpense = filteredExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0,
    );

    const categoryTotals = filteredExpenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});
    const highestCategory = Object.keys(categoryTotals).reduce(
        (a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b),
        'None',
    );

    // Nayi Category Add Karne Ka Logic
    const handleAddCustomCategory = () => {
        const cleanName = customCategoryName.trim();
        if (cleanName && !categories.includes(cleanName)) {
            setCategories([...categories, cleanName]);
            setFormData({ ...formData, category: cleanName });
            setCustomCategoryName('');
            setShowCustomCategoryInput(false);
        }
    };

    // Category Management Functions
    const handleRenameCategory = (index) => {
        const newName = editingCategoryName.trim();
        if (newName && !categories.includes(newName)) {
            const updatedCategories = [...categories];
            const oldName = updatedCategories[index];
            updatedCategories[index] = newName;
            setCategories(updatedCategories);

            // Update any expenses that use the old category name
            setExpenses(
                expenses.map((exp) =>
                    exp.category === oldName
                        ? { ...exp, category: newName }
                        : exp,
                ),
            );

            setEditingCategoryIndex(null);
            setEditingCategoryName('');
        }
    };

    const handleDeleteCategory = (index) => {
        const categoryToDelete = categories[index];
        if (
            window.confirm(
                `Kya aap "${categoryToDelete}" category delete karna chahte hain?`,
            )
        ) {
            const updatedCategories = categories.filter((_, i) => i !== index);
            setCategories(updatedCategories);

            // Update expenses that use the deleted category to "Others"
            setExpenses(
                expenses.map((exp) =>
                    exp.category === categoryToDelete
                        ? { ...exp, category: 'Others' }
                        : exp,
                ),
            );
        }
    };

    const handleAddNewCategoryInManager = () => {
        const cleanName = newCategoryNameInManager.trim();
        if (cleanName && !categories.includes(cleanName)) {
            setCategories([...categories, cleanName]);
            setNewCategoryNameInManager('');
        }
    };

    const handleInputChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setShowCustomCategoryInput(false);
        setFormData({
            title: '',
            amount: '',
            category: categories[0] || 'Chai-Paani',
            date: new Date().toISOString().split('T')[0],
        });
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
        });
        setShowCustomCategoryInput(false);
        // Ensure the expense's category is in the categories list
        if (!categories.includes(expense.category)) {
            setCategories([...categories, expense.category]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            category: formData.category,
            amount: Number(formData.amount),
            description: formData.title,
            date: new Date(formData.date).toISOString(),
        };

        if (editingId) {
            // Edit / Update
            (async () => {
                try {
                    const updated = await api.updateExpense(editingId, payload);
                    const updatedExpenseObj = {
                        id: updated._id || updated.id,
                        title: updated.description || updated.category,
                        amount: updated.amount ?? 0,
                        category: updated.category,
                        date: updated.date
                            ? new Date(updated.date).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0],
                    };
                    setExpenses(
                        expenses.map((exp) =>
                            exp.id === editingId ? updatedExpenseObj : exp,
                        ),
                    );
                    closeModal();
                } catch (err) {
                    console.error('Update expense failed', err);
                }
            })();
        } else {
            // Create
            (async () => {
                try {
                    const created = await api.createExpense(payload);
                    const newExpenseObj = {
                        id: created._id || created.id,
                        title: created.description || created.category,
                        amount: created.amount ?? 0,
                        category: created.category,
                        date: created.date
                            ? new Date(created.date).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0],
                    };
                    setExpenses([newExpenseObj, ...expenses]);
                    closeModal();
                } catch (err) {
                    console.error('Create expense failed', err);
                }
            })();
        }
    };

    const handleDelete = (id) => {
        if (
            window.confirm(
                'Kya aap is kharche ki entry delete karna chahte hain?',
            )
        ) {
            setExpenses(expenses.filter((exp) => exp.id !== id));
            (async () => {
                try {
                    await api.deleteExpense(id);
                } catch (err) {
                    console.error('Delete expense failed', err);
                }
            })();
        }
    };

    const handlePrintLedger = () => {
        const originalTitle = document.title;
        document.title =
            'Expenses_Report_' + new Date().toISOString().slice(0, 10);

        const style = document.createElement('style');
        style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #expenses-print-area, #expenses-print-area * {
          visibility: visible;
        }
        #expenses-print-area {
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
                        <Wallet size={32} className="text-red-500" />
                        Kharcha Book (Expenses)
                    </h1>
                    <p className={`mt-1 ${textMuted}`}>
                        Dukaan ke saare rozana aur mahine ke kharche.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setIsCategoryManagerOpen(true)}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-750' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        title="Edit category names"
                    >
                        <Settings size={20} /> Manage Categories
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintLedger}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-750' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Printer size={20} /> Print Report
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                amount: '',
                                category: categories[0] || 'Chai-Paani',
                                date: new Date().toISOString().split('T')[0],
                            });
                            setIsModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5"
                    >
                        <Plus size={20} /> Naya Kharcha Likhein
                    </button>
                </div>
            </div>

            {/* Analytics Mini Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div
                    className={`p-6 rounded-2xl border shadow-sm flex justify-between items-center ${cardBg}`}
                >
                    <div>
                        <p className={`text-sm font-medium ${textMuted}`}>
                            Is Mahine ka Kul Kharcha
                        </p>
                        <h3 className="text-3xl font-black mt-2 text-red-500 flex items-center">
                            <IndianRupee size={28} className="mr-0.5" />{' '}
                            {totalExpense.toLocaleString('en-IN')}
                        </h3>
                    </div>
                    <div
                        className={`p-4 rounded-xl ${themeMode === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}
                    >
                        <ArrowUpRight size={28} />
                    </div>
                </div>

                <div
                    className={`p-6 rounded-2xl border shadow-sm flex justify-between items-center ${cardBg}`}
                >
                    <div>
                        <p className={`text-sm font-medium ${textMuted}`}>
                            Sabse Zyada Kharcha kispe?
                        </p>
                        <h3
                            className={`text-2xl font-bold mt-2 ${themeMode === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}
                        >
                            {highestCategory}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Total: ₹
                            {categoryTotals[highestCategory]?.toLocaleString(
                                'en-IN',
                            ) || 0}
                        </p>
                    </div>
                    <div
                        className={`p-4 rounded-xl ${themeMode === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}
                    >
                        <TrendingUp size={28} />
                    </div>
                </div>
            </div>

            {/* Search and Advanced Filters */}
            <div className={`p-6 rounded-2xl border shadow-sm mb-6 ${cardBg}`}>
                <div className="flex flex-col gap-6">
                    {/* Top Row: Search & Category & Actions */}
                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={20} className={textMuted} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search kharcha..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all ${inputBg}`}
                                    style={{
                                        borderColor: `var(--color-${primaryColor}-500)`,
                                    }}
                                />
                            </div>

                            <div className="relative w-full sm:w-56">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) =>
                                        setCategoryFilter(e.target.value)
                                    }
                                    className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none font-medium cursor-pointer transition-all ${inputBg}`}
                                    style={{
                                        borderColor: `var(--color-${primaryColor}-500)`,
                                    }}
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map((cat, i) => (
                                        <option key={i} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter size={18} className={textMuted} />
                                </div>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <ChevronDown
                                        size={18}
                                        className={textMuted}
                                    />
                                </div>
                            </div>
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
                                    setCategoryFilter('All');
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border hover:scale-[1.02] cursor-pointer ${
                                    themeMode === 'dark'
                                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Reset Filters
                            </button>
                            <span
                                className={`text-xs font-bold ${textMuted} whitespace-nowrap`}
                            >
                                Showing {filteredExpenses.length} of{' '}
                                {expenses.length} Entries
                            </span>
                        </div>
                    </div>

                    {/* Middle Row: Date Quick Presets */}
                    <div className="flex flex-col gap-3">
                        <label
                            className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}
                        >
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
                                        onClick={() =>
                                            setDateFilter(preset.key)
                                        }
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
                            themeMode === 'dark'
                                ? 'bg-gray-900/40 border-gray-700'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        {/* Custom Start Date */}
                        <div
                            className={`${dateFilter === 'custom' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
                        >
                            <label
                                className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}
                            >
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
                        <div
                            className={`${dateFilter === 'custom' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
                        >
                            <label
                                className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}
                            >
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
                            <label
                                className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}
                            >
                                Min Expense Amount (₹)
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
                            <label
                                className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}
                            >
                                Max Expense Amount (₹)
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

            {/* EXPENSES TABLE */}
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
                                    Details (Kiske liye hua)
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Category
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Tareekh (Date)
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Amount
                                </th>
                                <th className="p-4 font-semibold text-sm text-center">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className={`p-8 text-center ${textMuted}`}
                                    >
                                        Koi kharcha nahi mila.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr
                                        key={expense.id}
                                        className={`border-b transition-colors duration-150 ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-100'} ${rowHover}`}
                                    >
                                        <td className="p-4 font-semibold text-base">
                                            {expense.title}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${themeMode === 'dark' ? 'bg-red-950/50 text-red-400 border-red-900/50' : 'bg-red-50 text-red-700 border-red-100'}`}
                                            >
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td
                                            className={`p-4 text-sm flex items-center gap-1.5 ${textMuted}`}
                                        >
                                            <Calendar size={14} />{' '}
                                            {expense.date}
                                        </td>
                                        <td className="p-4 font-black text-red-500 text-base">
                                            <span className="inline-flex items-center">
                                                <IndianRupee size={14} />{' '}
                                                {expense.amount}
                                            </span>
                                        </td>

                                        {/* ALIGNED ACTION BUTTONS */}
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center justify-center gap-3 w-full">
                                                {/* 1. Edit Button */}
                                                <button
                                                    onClick={() =>
                                                        handleEdit(expense)
                                                    }
                                                    className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                                        themeMode === 'dark'
                                                            ? 'border-blue-900 text-blue-400 hover:bg-blue-950/50'
                                                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                    title="Edit Entry"
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                {/* 2. Delete Button */}
                                                <button
                                                    onClick={() =>
                                                        handleDelete(expense.id)
                                                    }
                                                    className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center cursor-pointer ${
                                                        themeMode === 'dark'
                                                            ? 'border-red-900 text-red-400 hover:bg-red-950/50'
                                                            : 'border-red-200 text-red-600 hover:bg-red-50'
                                                    }`}
                                                    title="Delete Entry"
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

            {/* HIDDEN PRINT AREA FOR EXPENSES LEDGER */}
            <div
                id="expenses-print-area"
                className="hidden print:block p-8 font-mono text-[11px] leading-tight text-black bg-white"
            >
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
                        💰 Expenses Report (Kharcha Book) 💰
                    </h1>
                    <p className="text-xs font-semibold">
                        Generated on: {new Date().toLocaleString('en-IN')}
                    </p>
                    <div className="border-b-2 border-black my-4"></div>
                </div>

                {/* SUMMARY BOARD */}
                <div className="grid grid-cols-2 gap-4 mb-6 border p-3 bg-gray-50 rounded">
                    <div>
                        <span className="font-bold block">Total Entries:</span>
                        <span>{filteredExpenses.length} expenses recorded</span>
                    </div>
                    <div>
                        <span className="font-bold block">
                            Total Expense Amount:
                        </span>
                        <span className="text-red-600 font-bold">
                            ₹
                            {filteredExpenses
                                .reduce((sum, exp) => sum + exp.amount, 0)
                                .toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                {/* CATEGORY-WISE BREAKDOWN */}
                {Object.keys(categoryTotals).length > 0 && (
                    <div className="mb-6 border p-3 bg-gray-50 rounded">
                        <p className="font-bold mb-2 underline">
                            📊 Category-Wise Breakdown:
                        </p>
                        <table className="w-full text-left border-collapse text-[10px]">
                            <tbody>
                                {Object.entries(categoryTotals).map(
                                    ([cat, amount]) => (
                                        <tr
                                            key={cat}
                                            className="border-b border-gray-200"
                                        >
                                            <td className="py-1 px-2">{cat}</td>
                                            <td className="py-1 px-2 text-right font-semibold">
                                                ₹
                                                {amount.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* DETAILED EXPENSES TABLE */}
                <div className="mb-4">
                    <p className="font-bold mb-2 underline">
                        📝 Detailed Expenses List:
                    </p>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-2 font-bold w-8">#</th>
                                <th className="py-2 font-bold">Description</th>
                                <th className="py-2 font-bold">Category</th>
                                <th className="py-2 font-bold">Date</th>
                                <th className="py-2 font-bold text-right w-20">
                                    Amount (₹)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="py-3 text-center text-gray-500"
                                    >
                                        No expenses recorded
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((exp, index) => (
                                    <tr
                                        key={exp.id}
                                        className="border-b border-gray-300"
                                    >
                                        <td className="py-2">{index + 1}</td>
                                        <td className="py-2 font-semibold">
                                            {exp.title}
                                        </td>
                                        <td className="py-2">{exp.category}</td>
                                        <td className="py-2">{exp.date}</td>
                                        <td className="py-2 text-right font-bold text-red-600">
                                            ₹
                                            {exp.amount.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* TOTALS SUMMARY */}
                <div className="mt-6 border-t-2 border-black pt-4 text-right">
                    <p className="font-bold text-lg mb-2">
                        Grand Total:{' '}
                        <span className="text-red-600">
                            ₹
                            {filteredExpenses
                                .reduce((sum, exp) => sum + exp.amount, 0)
                                .toLocaleString('en-IN')}
                        </span>
                    </p>
                </div>

                {/* SIGNATURE BAR */}
                <div className="mt-12 flex justify-between">
                    <div className="w-48 text-center border-t border-black pt-2">
                        <span>Prepared By</span>
                    </div>
                    <div className="w-48 text-center border-t border-black pt-2">
                        <span>Authorized Signature</span>
                    </div>
                </div>
            </div>

            {/* ADD NEW EXPENSE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                        <div
                            className={`flex justify-between items-center p-5 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2 text-red-500">
                                <Wallet size={20} />{' '}
                                {editingId
                                    ? 'Kharcha Edit / Update Karein'
                                    : 'Naya Kharcha Note Karein'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className={`p-2 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Kharcha Kiske Liye Hua?
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${inputBg}`}
                                    placeholder="e.g. WiFi ka Recharge"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                    >
                                        Amount (Kitne Paise?)
                                    </label>
                                    <div className="relative">
                                        <div
                                            className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                                        >
                                            <IndianRupee size={14} />
                                        </div>
                                        <input
                                            type="number"
                                            name="amount"
                                            required
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${inputBg}`}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label
                                            className={`block text-xs font-bold uppercase tracking-wide ${textMuted}`}
                                        >
                                            Category
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCustomCategoryInput(
                                                    !showCustomCategoryInput,
                                                )
                                            }
                                            className="text-[10px] font-black text-blue-500 hover:underline"
                                        >
                                            + New
                                        </button>
                                    </div>

                                    {!showCustomCategoryInput ? (
                                        <div className="relative">
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className={`w-full appearance-none px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${inputBg}`}
                                            >
                                                {categories.map((cat, i) => (
                                                    <option key={i} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <ChevronDown
                                                    size={16}
                                                    className={textMuted}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={customCategoryName}
                                                onChange={(e) =>
                                                    setCustomCategoryName(
                                                        e.target.value,
                                                    )
                                                }
                                                className={`w-full px-2 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
                                                placeholder="Add Cat Name"
                                            />
                                            <button
                                                type="button"
                                                onClick={
                                                    handleAddCustomCategory
                                                }
                                                className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Tareekh (Date)
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500 ${inputBg}`}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className={`px-4 py-2 rounded-xl font-bold ${themeMode === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md"
                                >
                                    {editingId
                                        ? 'Kharcha Update Karein'
                                        : 'Kharcha Save Karein'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY MANAGER MODAL */}
            {isCategoryManagerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                        <div
                            className={`flex justify-between items-center p-5 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
                                <Settings size={20} /> Category Manager
                            </h2>
                            <button
                                onClick={() => {
                                    setIsCategoryManagerOpen(false);
                                    setEditingCategoryIndex(null);
                                    setEditingCategoryName('');
                                }}
                                className={`p-2 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 max-h-[400px] overflow-y-auto space-y-2">
                            <p
                                className={`text-sm font-semibold mb-3 ${textMuted}`}
                            >
                                Apne saare categories ko edit ya delete karein:
                            </p>
                            {categories.map((cat, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                        editingCategoryIndex === index
                                            ? themeMode === 'dark'
                                                ? 'bg-blue-950 border-blue-800'
                                                : 'bg-blue-50 border-blue-200'
                                            : themeMode === 'dark'
                                              ? 'bg-gray-900 border-gray-700 hover:bg-gray-850'
                                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {editingCategoryIndex === index ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editingCategoryName}
                                                onChange={(e) =>
                                                    setEditingCategoryName(
                                                        e.target.value,
                                                    )
                                                }
                                                className={`flex-1 px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg}`}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() =>
                                                    handleRenameCategory(index)
                                                }
                                                className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCategoryIndex(
                                                        null,
                                                    );
                                                    setEditingCategoryName('');
                                                }}
                                                className={`px-3 py-2 text-xs font-bold rounded border ${themeMode === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'}`}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 font-semibold">
                                                {cat}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setEditingCategoryIndex(
                                                        index,
                                                    );
                                                    setEditingCategoryName(cat);
                                                }}
                                                className={`p-2 rounded transition-colors ${themeMode === 'dark' ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}
                                                title="Edit category name"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            {categories.length > 1 && (
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCategory(
                                                            index,
                                                        )
                                                    }
                                                    className={`p-2 rounded transition-colors ${themeMode === 'dark' ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'}`}
                                                    title="Delete category"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ADD NEW CATEGORY SECTION */}
                        <div
                            className={`p-4 border-t ${themeMode === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}
                        >
                            <p
                                className={`text-xs font-bold mb-2 uppercase tracking-wide ${textMuted}`}
                            >
                                Naya Category Add Karein
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryNameInManager}
                                    onChange={(e) =>
                                        setNewCategoryNameInManager(
                                            e.target.value,
                                        )
                                    }
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleAddNewCategoryInManager();
                                        }
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${inputBg}`}
                                    placeholder="e.g. Marketing"
                                />
                                <button
                                    onClick={handleAddNewCategoryInManager}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        <div
                            className={`p-4 border-t flex justify-end ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <button
                                onClick={() => {
                                    setIsCategoryManagerOpen(false);
                                    setEditingCategoryIndex(null);
                                    setEditingCategoryName('');
                                }}
                                className="px-5 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
