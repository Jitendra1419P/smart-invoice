import { useState, useEffect } from 'react';
import useSettingsStore from '../store/settingsStore';
// DYNAMIC IMPORTS
import {
    initialSuppliers,
    initialSupplierProducts,
    initialProducts,
} from '../data/mockData';
import * as api from '../api';

import {
    Truck,
    Search,
    Plus,
    HandCoins,
    MessageCircle,
    ShoppingBag,
    Trash2,
    X,
    ArrowUpRight,
    IndianRupee,
    Phone,
    Filter,
    ChevronDown,
    AlertTriangle,
    Edit,
    Check,
    PackagePlus,
    Printer,
} from 'lucide-react';

const Suppliers = () => {
    const { themeMode, primaryColor } = useSettingsStore();

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false); // <-- NEW: Purchase modal state
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // Quick Inline Edit States
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [editItemPrice, setEditItemPrice] = useState('');
    const [editItemStock, setEditItemStock] = useState('');

    // Form States
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        company: '',
        phone: '',
        openingPayable: '',
    });
    const [paymentAmount, setPaymentAmount] = useState('');

    // Bank integration states
    const [bankAccounts, setBankAccounts] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedBankId, setSelectedBankId] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');

    // NEW: Purchase Entry Form States
    const [purchaseData, setPurchaseData] = useState({
        productName: '',
        qtyToAdd: '',
        itemCost: '',
    });

    // Theme Colors
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
            ? `bg-gray-700 border-gray-600 text-white`
            : `bg-gray-50 border-gray-300 text-black`;
    const rowHover =
        themeMode === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50';

    // Load suppliers from backend (fallback to mock data if fetch fails)
    const [suppliers, setSuppliers] = useState([]);

    const [supplierProducts, setSupplierProducts] = useState({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [suppliersData, productsData, bankAccountsData] = await Promise.all([
                    api.getSuppliers(),
                    api.getProducts(),
                    api.getBankAccounts(),
                ]);
                if (!mounted) return;

                const mappedSuppliers = suppliersData.map((s) => ({
                    id: s._id || s.id,
                    name: s.name,
                    company: s.name,
                    phone: s.phone,
                    payable: s.totalPayable ?? 0,
                    address: s.address ?? '',
                }));
                setSuppliers(mappedSuppliers);

                // Group products dynamically by their supplier's name
                const grouped = {};
                mappedSuppliers.forEach((s) => {
                    grouped[s.company] = [];
                });

                productsData.forEach((p) => {
                    const sName = p.supplierId?.name || p.supplier || 'Unknown';
                    if (!grouped[sName]) {
                        grouped[sName] = [];
                    }
                    grouped[sName].push({
                        id: p._id || p.id,
                        name: p.name + (p.weight ? ` (${p.weight})` : ''),
                        stock: p.stock ?? 0,
                        minStock: p.minStock ?? 10,
                        price: p.price ?? p.salePrice ?? 0,
                    });
                });
                setSupplierProducts(grouped);

                setBankAccounts(bankAccountsData);
                if (bankAccountsData.length > 0) {
                    setSelectedBankId(bankAccountsData[0]._id || bankAccountsData[0].id);
                }
            } catch (err) {
                console.error('Load suppliers, products and banks failed', err);
                setSuppliers(initialSuppliers);
                setSupplierProducts(initialSupplierProducts);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Search & Filter Logic
    const filteredSuppliers = suppliers.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.company.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesFilter = true;
        if (filterType === 'DenaHai') matchesFilter = s.payable > 0;
        else if (filterType === 'Clear') matchesFilter = s.payable === 0;
        return matchesSearch && matchesFilter;
    });

    const totalPayable = suppliers.reduce((sum, s) => sum + s.payable, 0);

    // Handlers
    const handleAddSupplier = (e) => {
        e.preventDefault();
        const payload = {
            name: newSupplier.name,
            phone: newSupplier.phone,
            address: '',
            totalPayable: Number(newSupplier.openingPayable) || 0,
        };
        (async () => {
            try {
                const created = await api.createSupplier(payload);
                const supplierObj = {
                    id: created._id || created.id,
                    name: created.name,
                    company: created.name,
                    phone: created.phone,
                    payable: created.totalPayable ?? 0,
                    address: created.address ?? '',
                };
                setSuppliers([supplierObj, ...suppliers]);
                setIsAddModalOpen(false);
                setNewSupplier({
                    name: '',
                    company: '',
                    phone: '',
                    openingPayable: '',
                });
            } catch (err) {
                console.error('Create supplier failed', err);
            }
        })();
    };

    // STRUCTURE FUNCTION: Add Purchase Entry Form Submission (Maal badhane ka logic)
    const handlePurchaseSubmit = (e) => {
        e.preventDefault();
        const company = selectedSupplier.company;

        // Find the target product to get its DB ID
        const targetProduct = (supplierProducts[company] || []).find(
            (item) => item.name === purchaseData.productName,
        );

        // 1. Local Supplier Products array state update karein
        const updatedSupplierItems = (supplierProducts[company] || []).map(
            (item) => {
                if (item.name === purchaseData.productName) {
                    return {
                        ...item,
                        stock: item.stock + Number(purchaseData.qtyToAdd),
                        price: Number(purchaseData.itemCost) || item.price,
                    };
                }
                return item;
            },
        );

        setSupplierProducts({
            ...supplierProducts,
            [company]: updatedSupplierItems,
        });

        // 2. Main Suppliers Account Balance (Payable) update karein
        const billAmount =
            Number(purchaseData.qtyToAdd) *
            (Number(purchaseData.itemCost) || 0);
        const newPayable = selectedSupplier.payable + billAmount;

        (async () => {
            try {
                await api.updateSupplier(selectedSupplier.id, {
                    totalPayable: newPayable,
                });
                setSuppliers(
                    suppliers.map((s) =>
                        s.id === selectedSupplier.id
                            ? { ...s, payable: newPayable }
                            : s,
                    ),
                );

                // Update target product stock and purchase price inside backend MongoDB persistently!
                if (targetProduct && targetProduct.id) {
                    const newPrice =
                        Number(purchaseData.itemCost) || targetProduct.price;
                    const newStock =
                        targetProduct.stock + Number(purchaseData.qtyToAdd);
                    await api.updateProduct(targetProduct.id, {
                        price: newPrice,
                        stock: newStock,
                    });
                }

                alert(
                    `Maal Stock badh gaya! Supplier Payable Account me ₹${billAmount} add ho gaye.`,
                );
            } catch (err) {
                console.error('Purchase submit failed', err);
            }
        })();

        setIsPurchaseModalOpen(false);
        setPurchaseData({ productName: '', qtyToAdd: '', itemCost: '' });
    };

    const openPaymentModal = (supplier) => {
        setSelectedSupplier(supplier);
        setIsPaymentModalOpen(true);
    };
    const openItemsModal = (supplier) => {
        setSelectedSupplier(supplier);
        setEditingItemIndex(null);
        setIsItemsModalOpen(true);
    };
    const openPurchaseModal = (supplier) => {
        setSelectedSupplier(supplier);
        setPurchaseData({
            productName: supplierProducts[supplier.company]?.[0]?.name || '',
            qtyToAdd: '',
            itemCost: supplierProducts[supplier.company]?.[0]?.price || '',
        });
        setIsPurchaseModalOpen(true);
    };

    const handlePaySupplier = (e) => {
        e.preventDefault();
        const amount = Number(paymentAmount);
        const newPayable = Math.max(0, selectedSupplier.payable - amount);
        (async () => {
            try {
                await api.updateSupplier(selectedSupplier.id, {
                    totalPayable: newPayable,
                    paymentMethod,
                    selectedBankId: (paymentMethod === 'Cheque' || paymentMethod === 'UPI') ? selectedBankId : undefined,
                    paidAmount: amount,
                    chequeNumber: paymentMethod === 'Cheque' || paymentMethod === 'UPI' ? chequeNumber : undefined,
                    supplierName: selectedSupplier.name,
                    paymentDate: new Date().toISOString().split('T')[0]
                });
                setSuppliers(
                    suppliers.map((s) =>
                        s.id === selectedSupplier.id
                            ? { ...s, payable: newPayable }
                            : s,
                    ),
                );
            } catch (err) {
                console.error('Pay supplier failed', err);
            }
        })();
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentMethod('Cash');
        setChequeNumber('');
        setSelectedSupplier(null);
    };

    const handleDeleteSupplier = (id) => {
        if (
            window.confirm('Kya aap is supplier ka ledger hatana chahte hain?')
        ) {
            setSuppliers(suppliers.filter((s) => s.id !== id));
            (async () => {
                try {
                    await api.deleteSupplier(id);
                } catch (err) {
                    console.error('Delete supplier failed', err);
                }
            })();
        }
    };

    const startEditingItem = (index, currentPrice, currentStock) => {
        setEditingItemIndex(index);
        setEditItemPrice(currentPrice);
        setEditItemStock(currentStock);
    };

    const saveEditedItem = (index) => {
        const company = selectedSupplier.company;
        const updatedItems = [...supplierProducts[company]];
        const item = updatedItems[index];

        const newPrice = Number(editItemPrice);
        const newStock = Number(editItemStock);

        updatedItems[index] = {
            ...item,
            price: newPrice,
            stock: newStock,
        };
        setSupplierProducts({ ...supplierProducts, [company]: updatedItems });
        setEditingItemIndex(null);

        // Persist to backend database!
        if (item.id) {
            (async () => {
                try {
                    await api.updateProduct(item.id, {
                        price: newPrice,
                        stock: newStock,
                    });
                } catch (err) {
                    console.error('Failed to update product in database', err);
                }
            })();
        }
    };

    const handlePrintLedger = () => {
        const originalTitle = document.title;
        document.title =
            'Suppliers_Ledger_Report_' + new Date().toISOString().slice(0, 10);

        const style = document.createElement('style');
        style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #suppliers-print-area, #suppliers-print-area * {
          visibility: visible;
        }
        #suppliers-print-area {
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
                        <Truck
                            size={32}
                            className={`text-${primaryColor}-500`}
                        />{' '}
                        Suppliers Ledger (Maal-Wale)
                    </h1>
                    <p className={`mt-1 ${textMuted}`}>
                        Jahan se maal aata hai aur unka hisaab-kitab.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handlePrintLedger}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${themeMode === 'dark' ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-750' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Printer size={20} /> Print Ledger Sheet
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md bg-${primaryColor}-600 text-white hover:bg-${primaryColor}-700 hover:-translate-y-0.5`}
                    >
                        <Plus size={20} /> Naya Supplier Jodein
                    </button>
                </div>
            </div>

            {/* Top Box Stats & Filters */}
            <div
                className={`p-6 rounded-2xl border shadow-sm mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 ${cardBg}`}
            >
                <div className="flex items-center gap-4">
                    <div
                        className={`p-4 rounded-xl ${themeMode === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'}`}
                    >
                        <ArrowUpRight size={28} />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${textMuted}`}>
                            Total Payable (Market mein dena baki hai)
                        </p>
                        <h3 className="text-3xl font-bold mt-1 text-red-500 flex items-center">
                            <IndianRupee size={28} className="mr-0.5" />{' '}
                            {totalPayable.toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={20} className={textMuted} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 transition-all ${inputBg}`}
                        />
                    </div>
                    <div className="relative w-full sm:w-44">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none focus:ring-2 font-medium cursor-pointer transition-all ${inputBg}`}
                        >
                            <option value="All">Sabhi Suppliers</option>
                            <option value="DenaHai">Paisa Dena Hai</option>
                            <option value="Clear">Hisaab Clear</option>
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

            {/* SUPPLIERS TABLE */}
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
                                    Supplier / Company
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Phone Number
                                </th>
                                <th className="p-4 font-semibold text-sm">
                                    Kitna Dena Hai?
                                </th>
                                <th className="p-4 font-semibold text-sm text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className={`border-b transition-colors duration-150 ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-100'} ${rowHover}`}
                                >
                                    <td className="p-4 py-5">
                                        <div className="font-bold text-base">
                                            {supplier.name}
                                        </div>
                                        <div
                                            className={`text-xs mt-0.5 ${textMuted}`}
                                        >
                                            {supplier.company}
                                        </div>
                                    </td>
                                    <td className="p-4 py-5">
                                        <div className="flex items-center gap-1 text-sm font-medium">
                                            <span>
                                                {supplier.phone || '---'}
                                            </span>
                                            {supplier.phone && (
                                                <a
                                                    href={`tel:${supplier.phone}`}
                                                    className="text-blue-500 hover:text-blue-400 p-0.5"
                                                >
                                                    <Phone size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 py-5">
                                        {supplier.payable > 0 ? (
                                            <span className="inline-flex items-center gap-0.5 font-extrabold text-red-500 text-base">
                                                <IndianRupee size={16} />{' '}
                                                {supplier.payable}
                                            </span>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center gap-1 font-bold text-sm px-2.5 py-1 rounded-full ${themeMode === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}
                                            >
                                                No Dues 👍
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 py-5 text-center">
                                        <div className="inline-flex items-center justify-center gap-2 w-full">
                                            {/* Structure Action: Add Purchase Entry Button */}
                                            <button
                                                onClick={() =>
                                                    openPurchaseModal(supplier)
                                                }
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors h-9 bg-purple-600 text-white hover:bg-purple-700`}
                                                title="Naya Maal Receipt Likhein"
                                            >
                                                <PackagePlus size={14} /> + Maal
                                                Entry
                                            </button>

                                            <button
                                                onClick={() =>
                                                    openItemsModal(supplier)
                                                }
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors h-9 ${themeMode === 'dark' ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
                                                title="Maal ki List"
                                            >
                                                <ShoppingBag size={14} /> Items
                                            </button>

                                            {supplier.payable > 0 ? (
                                                <button
                                                    onClick={() =>
                                                        openPaymentModal(
                                                            supplier,
                                                        )
                                                    }
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors h-9 ${themeMode === 'dark' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                                                >
                                                    <HandCoins size={14} />{' '}
                                                    Hisaab
                                                </button>
                                            ) : (
                                                <div className="w-[74px] h-9 invisible sm:block"></div>
                                            )}

                                            <button
                                                className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center ${themeMode === 'dark' ? 'border-green-800 text-green-400' : 'border-green-200 text-green-600'}`}
                                                title="WhatsApp Order"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteSupplier(
                                                        supplier.id,
                                                    )
                                                }
                                                className={`p-2 rounded-lg transition-colors border h-9 w-9 flex items-center justify-center ${themeMode === 'dark' ? 'border-red-900 text-red-400' : 'border-red-200 text-red-600'}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* STRUCTURE MODAL: ADD PURCHASE ENTRY */}
            {isPurchaseModalOpen && selectedSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                        <div
                            className={`flex justify-between items-center p-5 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2 text-purple-500">
                                <PackagePlus size={20} /> Add Purchase Entry (
                                {selectedSupplier.company})
                            </h2>
                            <button
                                onClick={() => setIsPurchaseModalOpen(false)}
                                className={`p-2 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form
                            onSubmit={handlePurchaseSubmit}
                            className="p-5 space-y-4"
                        >
                            {(supplierProducts[selectedSupplier.company] || [])
                                .length === 0 ? (
                                <div className="text-center p-6 rounded-xl border border-dashed border-amber-500/40 bg-amber-50/10 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle
                                        size={24}
                                        className="mx-auto mb-2 text-amber-500"
                                    />
                                    <p className="font-bold text-sm">
                                        No Products Linked!
                                    </p>
                                    <p className="text-xs mt-1">
                                        Pehle "Products" page me is supplier ke
                                        liye koi product add karein.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsPurchaseModalOpen(false)
                                        }
                                        className="mt-4 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-md"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 uppercase text-gray-500">
                                            Kaunsa Maal Aaya?
                                        </label>
                                        <select
                                            value={purchaseData.productName}
                                            onChange={(e) => {
                                                const selectedItem = (
                                                    supplierProducts[
                                                        selectedSupplier.company
                                                    ] || []
                                                ).find(
                                                    (p) =>
                                                        p.name ===
                                                        e.target.value,
                                                );
                                                setPurchaseData({
                                                    ...purchaseData,
                                                    productName: e.target.value,
                                                    itemCost: selectedItem
                                                        ? selectedItem.price
                                                        : '',
                                                });
                                            }}
                                            className={`w-full px-3 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                                        >
                                            {(
                                                supplierProducts[
                                                    selectedSupplier.company
                                                ] || []
                                            ).map((p, idx) => (
                                                <option
                                                    key={idx}
                                                    value={p.name}
                                                >
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase text-gray-500">
                                                Quantity (Bori/Pcs)
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={purchaseData.qtyToAdd}
                                                onChange={(e) =>
                                                    setPurchaseData({
                                                        ...purchaseData,
                                                        qtyToAdd:
                                                            e.target.value,
                                                    })
                                                }
                                                className={`w-full px-3 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 uppercase text-gray-500">
                                                Kharidi Price (₹/Item)
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                value={purchaseData.itemCost}
                                                onChange={(e) =>
                                                    setPurchaseData({
                                                        ...purchaseData,
                                                        itemCost:
                                                            e.target.value,
                                                    })
                                                }
                                                className={`w-full px-3 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                                                placeholder="Cost price"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsPurchaseModalOpen(false)
                                            }
                                            className={`px-4 py-2 rounded-xl font-bold ${themeMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md"
                                        >
                                            Stock Update Karein
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 1: SUPPLIER ITEMS LIST */}
            {isItemsModalOpen && selectedSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-xl rounded-2xl shadow-2xl ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                        <div
                            className={`flex justify-between items-center p-5 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
                                    <ShoppingBag size={20} /> Supplied Products
                                    List
                                </h2>
                                <p className={`text-xs mt-0.5 ${textMuted}`}>
                                    {selectedSupplier.company} se aane wala maal
                                </p>
                            </div>
                            <button
                                onClick={() => setIsItemsModalOpen(false)}
                                className={`p-2 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 max-h-[380px] overflow-y-auto space-y-3">
                            {(supplierProducts[selectedSupplier.company] || [])
                                .length === 0 ? (
                                <div className="text-center p-8 text-gray-500 flex flex-col items-center">
                                    <ShoppingBag
                                        size={36}
                                        className="mb-2 text-gray-400 opacity-60"
                                    />
                                    <p className="font-bold text-sm">
                                        No Products Linked!
                                    </p>
                                    <p className="text-xs mt-1 text-gray-400">
                                        Pehle "Products" page me is supplier ke
                                        liye koi product select karein.
                                    </p>
                                </div>
                            ) : (
                                (
                                    supplierProducts[
                                        selectedSupplier.company
                                    ] || []
                                ).map((prod, index) => {
                                    const isLow = prod.stock <= prod.minStock;
                                    const isThisEditing =
                                        editingItemIndex === index;
                                    return (
                                        <div
                                            key={index}
                                            className={`flex justify-between items-center p-3 rounded-xl border transition-all ${themeMode === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                                        >
                                            <div className="flex-1">
                                                <p
                                                    className={`font-bold text-sm ${themeMode === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}
                                                >
                                                    {prod.name}
                                                </p>
                                                {isThisEditing ? (
                                                    <div className="flex gap-3 mt-2">
                                                        <div className="w-24">
                                                            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                                                Price (₹)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    editItemPrice
                                                                }
                                                                onChange={(e) =>
                                                                    setEditItemPrice(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`w-full px-2 py-1 text-xs rounded border ${themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                                            />
                                                        </div>
                                                        <div className="w-20">
                                                            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                                                                Stock Qty
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    editItemStock
                                                                }
                                                                onChange={(e) =>
                                                                    setEditItemStock(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className={`w-full px-2 py-1 text-xs rounded border ${themeMode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p
                                                        className={`text-xs flex items-center mt-0.5 ${textMuted}`}
                                                    >
                                                        Kharidi Price:{' '}
                                                        <span
                                                            className={`font-semibold ml-1 flex items-center ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                                                        >
                                                            <IndianRupee
                                                                size={10}
                                                            />
                                                            {prod.price}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 ml-2">
                                                {!isThisEditing && (
                                                    <div className="text-right">
                                                        {isLow ? (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${themeMode === 'dark' ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'}`}
                                                            >
                                                                <AlertTriangle
                                                                    size={12}
                                                                />{' '}
                                                                Stock:{' '}
                                                                {prod.stock}{' '}
                                                                (Low)
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${themeMode === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}
                                                            >
                                                                Stock:{' '}
                                                                {prod.stock}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {isThisEditing ? (
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                saveEditedItem(
                                                                    index,
                                                                )
                                                            }
                                                            className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setEditingItemIndex(
                                                                    null,
                                                                )
                                                            }
                                                            className={`p-1.5 rounded-lg text-xs font-bold ${themeMode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditingItem(
                                                                index,
                                                                prod.price,
                                                                prod.stock,
                                                            )
                                                        }
                                                        className={`p-1.5 rounded-lg transition-colors ${themeMode === 'dark' ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-gray-200'}`}
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div
                            className={`p-4 border-t flex justify-end ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <button
                                onClick={() => setIsItemsModalOpen(false)}
                                className="px-5 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD SUPPLIER */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                        <div
                            className={`flex justify-between items-center p-5 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Truck
                                    size={20}
                                    className={`text-${primaryColor}-500`}
                                />{' '}
                                Add New Supplier
                            </h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className={`p-2 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form
                            onSubmit={handleAddSupplier}
                            className="p-5 space-y-4"
                        >
                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Supplier Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newSupplier.name}
                                    onChange={(e) =>
                                        setNewSupplier({
                                            ...newSupplier,
                                            name: e.target.value,
                                        })
                                    }
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                                    placeholder="e.g. Ramesh Kumar"
                                />
                            </div>
                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Company / Agency Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newSupplier.company}
                                    onChange={(e) =>
                                        setNewSupplier({
                                            ...newSupplier,
                                            company: e.target.value,
                                        })
                                    }
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                                    placeholder="e.g. Ramesh Distributors"
                                />
                            </div>
                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    maxLength="10"
                                    value={newSupplier.phone}
                                    onChange={(e) =>
                                        setNewSupplier({
                                            ...newSupplier,
                                            phone: e.target.value,
                                        })
                                    }
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                                    placeholder="10 digit phone number"
                                />
                            </div>
                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Purana Baqaya (Opening Payable)
                                </label>
                                <div className="relative">
                                    <div
                                        className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                                    >
                                        <IndianRupee size={14} />
                                    </div>
                                    <input
                                        type="number"
                                        value={newSupplier.openingPayable}
                                        onChange={(e) =>
                                            setNewSupplier({
                                                ...newSupplier,
                                                openingPayable: e.target.value,
                                            })
                                        }
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className={`px-4 py-2 rounded-xl font-bold ${themeMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-5 py-2 rounded-xl font-bold text-white bg-${primaryColor}-600 hover:bg-${primaryColor}-700`}
                                >
                                    Supplier Save Karein
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: HISAAB CHUKTI */}
            {isPaymentModalOpen && selectedSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div
                        className={`w-full max-w-md rounded-2xl shadow-2xl ${themeMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                    >
                        <div
                            className={`flex justify-between items-center p-5 border-b ${themeMode === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                            <h2 className="text-lg font-bold flex items-center gap-2 text-amber-500">
                                <HandCoins size={20} /> Supplier Payment (Hisaab
                                Chukti)
                            </h2>
                            <button
                                onClick={() => {
                                    setIsPaymentModalOpen(false);
                                    setPaymentAmount('');
                                }}
                                className={`p-2 rounded-full transition-colors ${themeMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form
                            onSubmit={handlePaySupplier}
                            className="p-5 space-y-4"
                        >
                            <div
                                className={`p-4 rounded-xl border border-dashed ${themeMode === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <p className="text-xs font-semibold text-gray-500">
                                    Supplier / Company:
                                </p>
                                <p className="text-lg font-bold mt-0.5">
                                    {selectedSupplier.name} (
                                    {selectedSupplier.company})
                                </p>
                                <p className="text-xs font-semibold text-gray-500 mt-2">
                                    Humara Kul Dena Baaki:
                                </p>
                                <p className="text-xl font-black text-red-500 flex items-center mt-0.5">
                                    <IndianRupee size={18} />{' '}
                                    {selectedSupplier.payable}
                                </p>
                            </div>
                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Kitne Paise Diye?
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
                                        max={selectedSupplier.payable}
                                        value={paymentAmount}
                                        onChange={(e) =>
                                            setPaymentAmount(e.target.value)
                                        }
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${inputBg}`}
                                        placeholder="Amount enter karein"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                >
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${inputBg}`}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            {(paymentMethod === 'UPI' || paymentMethod === 'Cheque') && bankAccounts.length > 0 && (
                                <>
                                    <div>
                                        <label
                                            className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                        >
                                            Select Source Bank Account
                                        </label>
                                        <select
                                            value={selectedBankId}
                                            onChange={(e) => setSelectedBankId(e.target.value)}
                                            className={`w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${inputBg}`}
                                        >
                                            {bankAccounts.map((acc) => (
                                                <option key={acc._id} value={acc._id}>
                                                    {acc.bankName} - {acc.accountName} (₹{acc.currentBalance.toLocaleString("en-IN")})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            className={`block text-xs font-bold mb-1 uppercase tracking-wide ${textMuted}`}
                                        >
                                            {paymentMethod === 'Cheque' ? 'Cheque Number' : 'UPI Ref/Transaction Number'}
                                        </label>
                                        <input
                                            type="text"
                                            value={chequeNumber}
                                            onChange={(e) => setChequeNumber(e.target.value)}
                                            className={`w-full px-3 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${inputBg}`}
                                            placeholder={paymentMethod === 'Cheque' ? "e.g. 001234" : "e.g. UPI1293021"}
                                        />
                                    </div>
                                </>
                            )}
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setPaymentAmount('');
                                    }}
                                    className={`px-4 py-2 rounded-xl font-bold ${themeMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md"
                                >
                                    Jama Karein (Save)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* HIDDEN PRINT AREA FOR SUPPLIERS LEDGER */}
            <div
                id="suppliers-print-area"
                className="hidden print:block p-8 font-mono text-[11px] leading-tight text-black bg-white"
            >
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
                        🚚 Suppliers Credit Ledger (Maal-Wale) 🚚
                    </h1>
                    <p className="text-xs font-semibold">
                        Generated on: {new Date().toLocaleString('en-IN')}
                    </p>
                    <div className="border-b-2 border-black my-4"></div>
                </div>

                {/* SUMMARY BOARD FOR AUDITING */}
                <div className="grid grid-cols-2 gap-4 mb-6 border p-3 bg-gray-50 rounded">
                    <div>
                        <span className="font-bold block">
                            Total Suppliers:
                        </span>
                        <span>{filteredSuppliers.length} active suppliers</span>
                    </div>
                    <div>
                        <span className="font-bold block">
                            Total Payable Balance (Market mein dena hai):
                        </span>
                        <span>
                            ₹
                            {filteredSuppliers
                                .reduce((sum, s) => sum + s.payable, 0)
                                .toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                {/* SUPPLIERS TABLE WITH PRODUCTS */}
                {filteredSuppliers.map((s, suppIndex) => {
                    const supplierProds = supplierProducts[s.company] || [];
                    return (
                        <div
                            key={s.id}
                            className="mb-6 border border-gray-300 p-3 page-break-inside-avoid"
                        >
                            {/* Supplier Header */}
                            <div className="bg-gray-100 p-2 mb-3 border-b border-black">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-sm">
                                            {suppIndex + 1}. {s.name} (
                                            {s.company})
                                        </h3>
                                        <p className="text-[10px] text-gray-700">
                                            Phone: {s.phone || '---'} | Address:{' '}
                                            {s.address || '---'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xs">
                                            Payable:{' '}
                                            <span className="text-red-600">
                                                ₹
                                                {s.payable.toLocaleString(
                                                    'en-IN',
                                                )}
                                            </span>
                                        </p>
                                        <p className="text-[9px] font-semibold">
                                            {s.payable > 0 ? (
                                                <span className="text-red-600">
                                                    ⚠️ DUE
                                                </span>
                                            ) : (
                                                <span className="text-green-600">
                                                    ✓ CLEAR
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Products List */}
                            {supplierProds.length > 0 ? (
                                <div className="mb-2">
                                    <p className="text-[10px] font-bold mb-1 underline">
                                        📦 SUPPLIED PRODUCTS:
                                    </p>
                                    <table className="w-full text-left border-collapse text-[9px]">
                                        <thead>
                                            <tr className="border-b border-gray-400">
                                                <th className="py-1 px-1 font-bold">
                                                    S.No
                                                </th>
                                                <th className="py-1 px-1 font-bold">
                                                    Product Name
                                                </th>
                                                <th className="py-1 px-1 font-bold text-right w-16">
                                                    Current Stock
                                                </th>
                                                <th className="py-1 px-1 font-bold text-right w-16">
                                                    Min Stock
                                                </th>
                                                <th className="py-1 px-1 font-bold text-right w-16">
                                                    Purchase Price (₹)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supplierProds.map(
                                                (prod, prodIndex) => (
                                                    <tr
                                                        key={prodIndex}
                                                        className="border-b border-gray-200"
                                                    >
                                                        <td className="py-1 px-1">
                                                            {prodIndex + 1}
                                                        </td>
                                                        <td className="py-1 px-1">
                                                            {prod.name}
                                                        </td>
                                                        <td className="py-1 px-1 text-right">
                                                            <span
                                                                className={
                                                                    prod.stock <=
                                                                    prod.minStock
                                                                        ? 'font-bold text-red-600'
                                                                        : ''
                                                                }
                                                            >
                                                                {prod.stock}
                                                            </span>
                                                        </td>
                                                        <td className="py-1 px-1 text-right">
                                                            {prod.minStock}
                                                        </td>
                                                        <td className="py-1 px-1 text-right font-semibold">
                                                            ₹{prod.price}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-[9px] text-gray-600 italic mb-2">
                                    ❌ No products linked to this supplier
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* SIGNATURE BAR */}
                <div className="mt-16 flex justify-between">
                    <div className="w-48 text-center border-t border-black pt-2">
                        <span>Prepared By / Accounts Clerk</span>
                    </div>
                    <div className="w-48 text-center border-t border-black pt-2">
                        <span>Authorized Signature</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Suppliers;
