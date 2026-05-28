import { useState, useEffect } from "react";
import useSettingsStore from "../store/settingsStore";
import * as api from "../api";
// 1. Centralized mockData se products array import kiya
import { initialProducts } from "../data/mockData";
import { translations } from "../data/translations";

import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Printer,
  MessageCircle,
  ShoppingCart,
  IndianRupee,
  Tag,
} from "lucide-react";

const POS = () => {
  const { 
    themeMode, 
    primaryColor, 
    businessName, 
    printerSize, 
    logoUrl, 
    nextInvoiceNumber, 
    setNextInvoiceNumber,
    cin,
    gstin,
    shopAddress,
    website,
    supportEmail,
    supportPhone,
    fssai,
    taxRate,
    defaultDiscount,
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

  const biz = getDeterministicDetails(businessName);

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(defaultDiscount || 0);

  // Sync discount state with defaultDiscount setting when defaultDiscount changes or on mount
  useEffect(() => {
    setDiscount(defaultDiscount || 0);
  }, [defaultDiscount]);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getInvoicePrefix = () => {
    const name = businessName || "SmartInvoice";
    const cleanName = name.replace(/[^a-zA-Z]/g, "");
    const prefix = cleanName.substring(0, 2).toUpperCase();
    return prefix.length < 2 ? "SI" : prefix;
  };

  const generateInvoiceNumber = () => {
    const prefix = getInvoicePrefix();
    const paddedNum = String(nextInvoiceNumber).padStart(5, '0');
    return `${prefix}-${paddedNum}`;
  };

  useEffect(() => {
    if (cart.length > 0 && !invoiceNumber) {
      setInvoiceNumber(generateInvoiceNumber());
    } else if (cart.length === 0) {
      setInvoiceNumber("");
    }
  }, [cart, businessName, nextInvoiceNumber]);

  // 2. Load products and customers dynamically from the backend database
  const [products, setProducts] = useState([]);

  const loadProductsFromDB = async () => {
    try {
      const data = await api.getProducts();
      const mapped = data.map((p) => ({
        id: p._id || p.id,
        name: p.name,
        weight: p.weight || "",
        salePrice: p.salePrice ?? p.price ?? 0,
        price: p.price ?? p.salePrice ?? 0,
        stock: p.stock ?? 0,
        minStock: p.minStock ?? 10,
      }));
      setProducts(mapped);
    } catch (err) {
      console.error("Failed to load products in POS", err);
      setProducts(initialProducts);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadProductsFromDB();
    })();

    (async () => {
      try {
        const data = await api.getCustomers();
        if (!mounted) return;
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers in POS", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      } else {
        return [...prevCart, { ...product, qty: 1 }];
      }
    });
  };

  const updateQuantity = (id, delta) =>
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );
  const removeItem = (id) =>
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));

  const subTotal = cart.reduce(
    (total, item) => total + (item.salePrice || item.price) * item.qty, // Note: Humare mockData me 'salePrice' use ho rha hai fallback 'price' ke sath
    0,
  );
  const tax = subTotal * (taxRate / 100);
  const discountAmount = (subTotal * (parseFloat(discount) || 0)) / 100;
  const grandTotal = Math.max(0, subTotal + tax - discountAmount);
  const cgstRate = (taxRate / 2).toFixed(2);
  const sgstRate = (taxRate / 2).toFixed(2);

  const handleQuickSaveCustomer = async () => {
    if (!customerName || customerName.trim() === "") return;
    try {
      const nameTrimmed = customerName.trim();
      const cleanPhone = customerPhone.replace(/\D/g, "");
      
      const existing = customers.find(
        c => c.name.toLowerCase() === nameTrimmed.toLowerCase() ||
             (cleanPhone && c.phone === cleanPhone)
      );

      if (existing) {
        alert(`Grahak "${nameTrimmed}" pehle se hi saved hai!`);
        setSelectedCustomerId(existing._id || existing.id);
        return;
      }

      const created = await api.createCustomer({
        name: nameTrimmed,
        phone: cleanPhone || "0000000000",
        totalDue: 0,
        creditLimit: 5000
      });

      const updatedList = await api.getCustomers();
      setCustomers(updatedList);
      
      setSelectedCustomerId(created._id || created.id);
      alert(`Grahak "${nameTrimmed}" successfully save ho gaya hai!`);
    } catch (err) {
      console.error("Failed to quick save customer from POS", err);
      alert("Grahak save karne mein problem aayi, kripya check karein.");
    }
  };

  const syncCustomerUdhaar = async (amount) => {
    if (selectedCustomerId) {
      try {
        const found = customers.find(c => c._id === selectedCustomerId || c.id === selectedCustomerId);
        const currentDue = found ? (found.totalDue ?? 0) : 0;
        await api.updateCustomer(selectedCustomerId, { totalDue: currentDue + Math.round(amount) });
        const updatedList = await api.getCustomers();
        setCustomers(updatedList);
      } catch (err) {
        console.error("Failed to update customer balance on POS checkout", err);
      }
    } else if (customerName && customerName.trim() !== "") {
      try {
        const nameTrimmed = customerName.trim();
        const existing = customers.find(
          c => c.name.toLowerCase() === nameTrimmed.toLowerCase() ||
               (customerPhone && c.phone === customerPhone && customerPhone.trim() !== "")
        );

        if (existing) {
          const currentDue = existing.totalDue ?? 0;
          await api.updateCustomer(existing._id || existing.id, {
            totalDue: currentDue + Math.round(amount),
            ...(customerPhone && !existing.phone ? { phone: customerPhone.trim() } : {})
          });
        } else {
          await api.createCustomer({
            name: nameTrimmed,
            phone: customerPhone ? customerPhone.trim() : "0000000000",
            totalDue: Math.round(amount),
            creditLimit: 5000
          });
        }
        const updatedList = await api.getCustomers();
        setCustomers(updatedList);
      } catch (err) {
        console.error("Failed to auto-create or update customer on checkout", err);
      }
    }
  };

  const saveInvoiceToDB = async () => {
    try {
      await api.createInvoice({
        invoiceNumber: invoiceNumber,
        customerName: customerName || "One-Time Customer",
        customerPhone: customerPhone || "N/A",
        cart: cart.map(item => ({
          id: String(item.id),
          name: item.name,
          salePrice: item.salePrice || item.price,
          qty: item.qty
        })),
        subTotal: subTotal,
        tax: tax,
        discount: Number(discountAmount.toFixed(2)) || 0,
        grandTotal: Math.round(grandTotal)
      });
    } catch (err) {
      console.error("Failed to save invoice record to DB", err);
    }
  };

  const handlePrint = async () => {
    const originalTitle = document.title;
    const cleanCustomerName = (customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
    document.title = `${invoiceNumber}_${cleanCustomerName}`;

    window.print();

    document.title = originalTitle;

    await saveInvoiceToDB();
    await syncCustomerUdhaar(grandTotal);
    await loadProductsFromDB();

    setCart([]);
    setDiscount(defaultDiscount || 0);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId("");
    setNextInvoiceNumber(nextInvoiceNumber + 1);
  };

  const handleWhatsAppShare = async () => {
    if (cart.length === 0) return;

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit customer Phone Number in the Customer Details section first!");
      return;
    }

    let message = `*Dear ${customerName || "Customer"},*\n\n`;
    message += `*🧾 ${businessName || "SmartInvoice"} - Bill Receipt*\n`;
    if (invoiceNumber) {
      message += `Invoice No: *${invoiceNumber}*\n`;
    }
    message += `---------------------------------------\n`;
    message += `Date: ${new Date().toLocaleString()}\n\n`;
    message += `*Items:*\n`;

    cart.forEach((item) => {
      const price = item.salePrice || item.price;
      message += `- ${item.name} (Qty: ${item.qty}) - ₹${price * item.qty}\n`;
    });

    message += `\n*Summary:*\n`;
    message += `Subtotal: ₹${subTotal.toFixed(2)}\n`;
    message += `Tax (${taxRate}%): ₹${tax.toFixed(2)}\n`;
    if (discountAmount > 0) {
      message += `Discount (${discount}%): ₹${discountAmount.toFixed(2)}\n`;
    }
    message += `---------------------------------------\n`;
    message += `*Total Pay: ₹${Math.round(grandTotal)}*\n\n`;
    message += `Thank you for shopping with us! 🙏`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedText}`;
    window.open(whatsappUrl, "_blank");

    await saveInvoiceToDB();
    await syncCustomerUdhaar(grandTotal);
    await loadProductsFromDB();

    setCart([]);
    setDiscount(defaultDiscount || 0);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCustomerId("");
    setNextInvoiceNumber(nextInvoiceNumber + 1);
  };

  const isA4 = printerSize === "A4";
  const printWidth = isA4
    ? "100%"
    : printerSize === "80mm Thermal"
      ? "300px"
      : "220px";
  const printFontSize = isA4 ? "text-base" : "text-xs";
  const printHeadingSize = isA4 ? "text-3xl" : "text-xl";
  const logoHeight = isA4 ? "h-24" : "h-12";

  // Strict Theme Colors
  const bgMain =
    themeMode === "dark"
      ? "bg-gray-900 text-white"
      : "bg-gray-50 text-gray-900";
  const textMuted = themeMode === "dark" ? "text-gray-400" : "text-gray-500";
  const inputBg = themeMode === "dark"
    ? "bg-gray-700 border-gray-600 text-white"
    : "bg-gray-50 border-gray-300 text-black";
  return (
    <>
      <div
        className={`flex flex-col lg:flex-row min-h-screen lg:h-screen print:hidden ${bgMain}`}
      >
        {/* ========================================= */}
        {/* LEFT SIDE: Search & Select Items */}
        {/* ========================================= */}
        <div
          className={`flex-1 flex flex-col p-6 lg:border-r ${themeMode === "dark" ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{t.createBill}</h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-12 py-3.5 rounded-xl border-2 text-lg focus:outline-none focus:ring-0 transition-all ${
                themeMode === "dark"
                  ? `bg-gray-800 border-gray-600 text-white focus:border-${primaryColor}-500`
                  : `bg-white border-gray-300 text-black shadow-sm focus:border-${primaryColor}-500`
              }`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={22} className={textMuted} />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
              <div
                className={`p-1.5 rounded-lg ${themeMode === "dark" ? `bg-${primaryColor}-900/40 text-${primaryColor}-400` : `bg-${primaryColor}-100 text-${primaryColor}-600`}`}
              >
                <Barcode size={24} />
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-10">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${
                    themeMode === "dark"
                      ? `bg-gray-800 border-gray-700 hover:border-${primaryColor}-500`
                      : `bg-white border-gray-100 hover:border-${primaryColor}-500 hover:shadow-md`
                  }`}
                >
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {product.name} {product.weight && <span className="text-xs font-normal text-gray-500">({product.weight})</span>}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`font-bold text-${primaryColor}-500 flex items-center text-lg`}
                    >
                      <IndianRupee size={16} />{" "}
                      {product.salePrice || product.price}
                    </span>
                    <button
                      className={`p-1.5 rounded-lg ${
                        themeMode === "dark"
                          ? `bg-${primaryColor}-900/40 text-${primaryColor}-400`
                          : `bg-${primaryColor}-100 text-${primaryColor}-700`
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE: Cart & Checkout */}
        {/* ========================================= */}
        <div
          className={`w-full lg:w-[420px] flex flex-col shadow-2xl z-10 ${themeMode === "dark" ? "bg-gray-800" : "bg-white"}`}
        >
          <div
            className={`p-5 border-b flex items-center gap-2 ${themeMode === "dark" ? "border-gray-700" : "border-gray-200"}`}
          >
            <ShoppingCart size={24} className={`text-${primaryColor}-500`} />
            <h2 className="text-xl font-bold">{t.currentBill}</h2>
            <span
              className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                themeMode === "dark"
                  ? `bg-${primaryColor}-900/50 text-${primaryColor}-400`
                  : `bg-${primaryColor}-100 text-${primaryColor}-700`
              }`}
            >
              {cart.length} {t.items}
            </span>
          </div>

          {invoiceNumber && (
            <div className={`px-5 py-2.5 border-b flex justify-between items-center text-xs font-semibold ${themeMode === "dark" ? "bg-gray-900/40 text-gray-300 border-gray-700" : "bg-gray-50/50 text-gray-600 border-gray-150"}`}>
              <span>🧾 Invoice No:</span>
              <span className={`font-black text-sm text-${primaryColor}-500`}>{invoiceNumber}</span>
            </div>
          )}

          {/* Customer Details Block */}
          <div className={`p-4 border-b space-y-3 ${themeMode === "dark" ? "border-gray-700 bg-gray-900/20" : "border-gray-150 bg-gray-50/50"}`}>
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                {t.customerDetails}
              </p>
              {customers.length > 0 && (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCustomerId(id);
                    if (id === "") {
                      setCustomerName("");
                      setCustomerPhone("");
                    } else {
                      const found = customers.find(c => c._id === id || c.id === id);
                      if (found) {
                        setCustomerName(found.name);
                        setCustomerPhone(found.phone);
                      }
                    }
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded border cursor-pointer ${inputBg}`}
                >
                  <option value="">{t.selectExisting}</option>
                  {customers.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.grahakName}
                  value={customerName}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setSelectedCustomerId("");
                    setShowSuggestions(true);
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-${primaryColor}-500 ${inputBg}`}
                />
                {showSuggestions && customerName.trim() !== "" && (
                  <div className={`absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg shadow-lg border p-1 ${
                    themeMode === "dark" 
                      ? "bg-gray-800 border-gray-700 text-white" 
                      : "bg-white border-gray-200 text-black"
                  }`}>
                    {customers.filter(c => 
                      c.name.toLowerCase().includes(customerName.toLowerCase()) ||
                      (c.phone && c.phone.includes(customerName))
                    ).length === 0 ? (
                      <div className="p-2 text-[11px] text-gray-500 italic">No customer found</div>
                    ) : (
                      customers.filter(c => 
                        c.name.toLowerCase().includes(customerName.toLowerCase()) ||
                        (c.phone && c.phone.includes(customerName))
                      ).map(c => (
                        <div
                          key={c._id || c.id}
                          onMouseDown={() => {
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                            setSelectedCustomerId(c._id || c.id);
                            setShowSuggestions(false);
                          }}
                          className={`p-2 text-xs rounded cursor-pointer transition-colors flex justify-between items-center ${
                            themeMode === "dark" 
                              ? "hover:bg-gray-700" 
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <span className="font-bold">{c.name}</span>
                          <span className="text-gray-500 text-[10px]">{c.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder={t.phoneNumber}
                  maxLength="10"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    setSelectedCustomerId("");
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-${primaryColor}-500 ${inputBg}`}
                />
                {!selectedCustomerId && customerName && customerName.trim() !== "" && (
                  <button
                    onClick={handleQuickSaveCustomer}
                    title="Grahak Details save karein"
                    type="button"
                    className={`px-2 py-1 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                      themeMode === "dark"
                        ? `bg-${primaryColor}-900/40 text-${primaryColor}-400 border-${primaryColor}-800 hover:bg-${primaryColor}-900/60`
                        : `bg-${primaryColor}-100 text-${primaryColor}-700 border-${primaryColor}-200 hover:bg-${primaryColor}-200`
                    }`}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div
                className={`h-full flex flex-col items-center justify-center ${textMuted}`}
              >
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p>{t.emptyCart}</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${themeMode === "dark" ? "bg-gray-750 border-gray-700" : "bg-gray-50 border-gray-100"}`}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm truncate w-40">
                      {item.name} {item.weight && <span className="text-xs font-normal text-gray-500">({item.weight})</span>}
                    </h4>
                    <p
                      className={`text-xs mt-1 font-semibold flex items-center ${textMuted}`}
                    >
                      <IndianRupee size={12} /> {item.salePrice || item.price} x{" "}
                      {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 border rounded-lg p-1 ${
                        themeMode === "dark"
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "bg-white border-gray-200 text-black"
                      }`}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:text-red-500"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:text-green-500"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Trash Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        themeMode === "dark"
                          ? "text-red-400 bg-red-900/20 hover:bg-red-900/40"
                          : "text-red-500 bg-red-50 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary & Buttons */}
          <div
            className={`p-5 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${themeMode === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-100 bg-gray-50"}`}
          >
            <div className="space-y-2.5 mb-4 text-sm">
              <div className="flex justify-between">
                <span className={textMuted}>{t.subtotal}</span>
                <span className="font-semibold flex items-center">
                  <IndianRupee size={14} /> {subTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={textMuted}>{t.tax} ({taxRate}%)</span>
                <span className="font-semibold flex items-center">
                  <IndianRupee size={14} /> {tax.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className={`flex items-center gap-1 ${textMuted}`}>
                  <Tag size={14} /> {t.discount}
                </span>
                <div className="flex items-center gap-2">
                  {discountAmount > 0 && (
                    <span className="text-xs font-semibold text-red-500 whitespace-nowrap">
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  )}
                  <div className="relative w-18">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className={`w-full pr-5 pl-1.5 py-0.5 text-right rounded border text-xs font-semibold focus:outline-none focus:ring-1 transition-all ${
                        themeMode === "dark"
                          ? `bg-gray-800 border-gray-600 text-white focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500`
                          : `bg-white border-gray-300 text-black focus:border-${primaryColor}-500 focus:ring-${primaryColor}-500`
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none">
                      <span className={`text-[10px] font-bold ${textMuted}`}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-400 mt-2">
                <span className="text-xl font-bold">{t.totalPay}</span>
                <span
                  className={`text-3xl font-bold flex items-center text-${primaryColor}-500`}
                >
                  <IndianRupee size={24} className="mr-1" />{" "}
                  {Math.round(grandTotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              {/* WhatsApp Button */}
              <button
                onClick={handleWhatsAppShare}
                disabled={cart.length === 0}
                className={`py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 border-2 transition-all ${
                  cart.length === 0
                    ? themeMode === "dark"
                      ? "border-gray-700 text-gray-600 cursor-not-allowed"
                      : "border-gray-300 text-gray-400 cursor-not-allowed"
                    : themeMode === "dark"
                      ? "text-green-500 border-green-500 hover:bg-green-900/30"
                      : "text-green-600 border-green-600 hover:bg-green-50"
                }`}
              >
                <MessageCircle size={24} /> {t.whatsapp}
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                disabled={cart.length === 0}
                className={`py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg ${
                  cart.length === 0
                    ? themeMode === "dark"
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : `bg-${primaryColor}-600 text-white hover:bg-${primaryColor}-700 hover:-translate-y-1`
                }`}
              >
                <Printer size={24} /> {t.printBill}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* PRINT RECEIPT UI */}
      {/* ======================================= */}
      <div
        className="hidden print:block bg-white text-black p-4 font-mono w-full text-[11px] leading-tight"
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
          <p>Invoice No: {invoiceNumber}</p>
          <p>Invoice Date: {new Date().toLocaleDateString('en-GB')}</p>
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
              {cart.map((item, idx) => {
                const rate = item.salePrice || item.price;
                const value = rate * item.qty;
                const hsnCode = `1904${idx}0`;
                return (
                  <tr key={item.id} className="align-top">
                    <td className="py-1 text-gray-800">{hsnCode}</td>
                    <td className="py-1 pr-1 font-bold">{item.name} {item.weight && <span className="text-[9px] font-normal text-gray-600">({item.weight})</span>}</td>
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
            <span>Items:{cart.length}</span>
            <span>Qty:{cart.reduce((sum, i) => sum + i.qty, 0)}</span>
            <span>Amt: {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* 3. Savings & Tax Breakup Table */}
        <div className="my-3 text-center">
          <h4 className="text-xs font-black text-gray-950 tracking-tight uppercase">
            YOUR SAVINGS: ₹{discountAmount.toFixed(2)} (on MRP)
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
                <td className="py-1 text-right">{(grandTotal / (1 + taxRate / 100)).toFixed(2)}</td>
                <td className="py-1 text-right">{(tax / 2).toFixed(2)}</td>
                <td className="py-1 text-right">{(tax / 2).toFixed(2)}</td>
                <td className="py-1 text-right">......</td>
                <td className="py-1 text-right font-bold text-black">{grandTotal.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-black border-dashed font-black text-black">
                <td className="py-1">T</td>
                <td className="py-1 text-right">{(grandTotal / (1 + taxRate / 100)).toFixed(2)}</td>
                <td className="py-1 text-right">{(tax / 2).toFixed(2)}</td>
                <td className="py-1 text-right">{(tax / 2).toFixed(2)}</td>
                <td className="py-1 text-right">......</td>
                <td className="py-1 text-right">{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Order & Delivery Details */}
        <div className="border-t border-dashed border-black my-2"></div>
        <div className="font-mono text-[10px] space-y-1 text-gray-800">
          <div className="text-center font-bold uppercase tracking-wider mb-1 text-black">Order Details</div>
          <div className="flex justify-between font-bold">
            <span>ORDER NUMBER:{invoiceNumber}</span>
            <span>ORDER DATE:{new Date().toLocaleDateString('en-GB')}</span>
          </div>
          <p>DELIVERY DATE:{new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          <p>DELIVERY TIME:6:00 PM - 9:00 PM</p>
          <p>PAYMENT MODE:CASH ON DELIVERY (COD)</p>
        </div>

        {/* 5. Customer & PickUp Details */}
        <div className="border-t border-dashed border-black my-2"></div>
        <div className="font-mono text-[10px] space-y-1 text-gray-800">
          <div className="text-center font-bold uppercase tracking-wider mb-1 text-black">Customer & Delivery Details</div>
          <p>CUSTOMER NAME:{customerName || "One-Time Customer"}</p>
          <p>MOBILE NUMBER:{customerPhone || "N/A"}</p>
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
            ₹{grandTotal.toFixed(2)} to be collected at the time of delivery
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
    </>
  );
};

export default POS;
