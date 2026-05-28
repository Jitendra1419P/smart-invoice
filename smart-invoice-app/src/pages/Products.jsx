import { useState, useEffect } from "react";
import useSettingsStore from "../store/settingsStore";
// 1. DYNAMIC IMPORT: Data folder se products ko import kiya
import { initialProducts } from "../data/mockData";
import * as api from "../api";

import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  IndianRupee,
  AlertTriangle,
  X,
  ChevronDown,
  Filter,
  PackagePlus,
  Printer,
} from "lucide-react";

const Products = () => {
  const { themeMode, primaryColor } = useSettingsStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    weight: "",
    supplierId: "", // Selected supplier ID or "NEW"
    newSupplierName: "",
    newSupplierPhone: "",
    salePrice: "",
    purchasePrice: "",
    stock: "",
    minStock: "",
  });

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

  // 2. Load products and suppliers from backend
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getProducts();
        if (!mounted) return;
        // map backend products to frontend shape
        const mapped = data.map((p) => ({
          id: p._id || p.id,
          name: p.name,
          weight: p.weight || "",
          supplier: p.supplierId?.name || p.supplier || "Unknown",
          supplierId: p.supplierId?._id || p.supplierId?.id || "",
          salePrice: p.salePrice ?? p.price ?? 0,
          purchasePrice: p.price ?? p.salePrice ?? 0,
          stock: p.stock ?? 0,
          minStock: p.minStock ?? 10,
        }));
        setProducts(mapped);
      } catch (err) {
        // fallback to mock data
        setProducts(initialProducts);
      }
    })();

    (async () => {
      try {
        const data = await api.getSuppliers();
        if (!mounted) return;
        setSuppliers(data);
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStock = true;
    if (stockFilter === "Low") matchesStock = product.stock <= product.minStock;
    else if (stockFilter === "Medium")
      matchesStock =
        product.stock > product.minStock &&
        product.stock <= product.minStock * 2;
    else if (stockFilter === "Full")
      matchesStock = product.stock > product.minStock * 2;

    return matchesSearch && matchesStock;
  });

  const getStockStatus = (stock, minStock) => {
    if (stock <= minStock)
      return {
        label: "Low",
        class: themeMode === "dark" ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-700",
        icon: <AlertTriangle size={14} />,
      };
    else if (stock <= minStock * 2)
      return {
        label: "Medium",
        class: themeMode === "dark" ? "bg-yellow-900/40 text-yellow-400" : "bg-yellow-100 text-yellow-700",
        icon: null,
      };
    else
      return {
        label: "Full",
        class: themeMode === "dark" ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700",
        icon: null,
      };
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      weight: "",
      supplierId: "",
      newSupplierName: "",
      newSupplierPhone: "",
      salePrice: "",
      purchasePrice: "",
      stock: "",
      minStock: "",
    });
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      weight: product.weight || "",
      supplierId: product.supplierId || "",
      newSupplierName: "",
      newSupplierPhone: "",
      salePrice: product.salePrice,
      purchasePrice: product.purchasePrice,
      stock: product.stock,
      minStock: product.minStock,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Kya aap is item ko delete karna chahte hain?")) {
      // optimistic UI update + API call
      setProducts(products.filter((p) => p.id !== id));
      (async () => {
        try {
          await api.deleteProduct(id);
        } catch (err) {
          console.error("Delete failed", err);
        }
      })();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let targetSupplierId = null;
      let targetSupplierName = "Unknown";

      if (formData.supplierId === "NEW") {
        const trimmedName = formData.newSupplierName.trim();
        if (!trimmedName) {
          alert("Supplier Name is required.");
          return;
        }

        // Deduplication check
        const existing = suppliers.find(
          (s) => s.name.toLowerCase() === trimmedName.toLowerCase(),
        );

        if (existing) {
          targetSupplierId = existing._id || existing.id;
          targetSupplierName = existing.name;
        } else {
          // Create new supplier
          const createdSupplier = await api.createSupplier({
            name: trimmedName,
            phone: formData.newSupplierPhone.trim() || "---",
            totalPayable: 0,
          });
          targetSupplierId = createdSupplier._id || createdSupplier.id;
          targetSupplierName = createdSupplier.name;

          // Sync local suppliers state
          setSuppliers((prev) => [
            ...prev,
            {
              id: targetSupplierId,
              name: createdSupplier.name,
              phone: createdSupplier.phone,
              payable: 0,
              address: "",
            },
          ]);
        }
      } else if (formData.supplierId) {
        const found = suppliers.find(
          (s) => (s._id || s.id) === formData.supplierId,
        );
        targetSupplierId = formData.supplierId;
        targetSupplierName = found ? found.name : "Unknown";
      }

      const payload = {
        name: formData.name,
        price: Number(formData.purchasePrice) || Number(formData.salePrice) || 0,
        salePrice: Number(formData.salePrice) || Number(formData.purchasePrice) || 0,
        stock: Number(formData.stock) || 0,
        supplierId: targetSupplierId,
        weight: formData.weight,
      };

      if (editingId) {
        // update
        const updated = await api.updateProduct(editingId, payload);
        setProducts(
          products.map((p) =>
            p.id === editingId
              ? {
                  id: updated._id || updated.id,
                  name: updated.name,
                  weight: updated.weight || formData.weight,
                  supplier: targetSupplierName,
                  supplierId: targetSupplierId,
                  salePrice: updated.salePrice ?? updated.price,
                  purchasePrice: updated.price ?? updated.salePrice,
                  stock: updated.stock ?? 0,
                  minStock: formData.minStock || 10,
                }
              : p,
          ),
        );
      } else {
        // create
        const created = await api.createProduct(payload);
        const newProduct = {
          id: created._id || created.id,
          name: created.name,
          weight: created.weight || formData.weight,
          supplier: targetSupplierName,
          supplierId: targetSupplierId,
          salePrice: created.salePrice ?? created.price,
          purchasePrice: created.price ?? created.salePrice,
          stock: created.stock ?? 0,
          minStock: formData.minStock || 10,
        };
        setProducts([newProduct, ...products]);
      }
      closeModal();
    } catch (err) {
      console.error("Save product failed", err);
      alert("Error occurred while saving product!");
    }
  };

  const handlePrintStock = () => {
    const originalTitle = document.title;
    document.title = "Inventory_Stock_Sheet_" + new Date().toISOString().slice(0, 10);

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #stock-print-area, #stock-print-area * {
          visibility: visible;
        }
        #stock-print-area {
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
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package size={32} className={`text-${primaryColor}-500`} />
            Products Inventory
          </h1>
          <p className={`mt-1 ${textMuted}`}>
            Saare maal aur stock ki details.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrintStock}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md border ${themeMode === "dark" ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-750" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            <Printer size={20} /> Print Stock Sheet
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                weight: "",
                supplierId: "",
                newSupplierName: "",
                newSupplierPhone: "",
                salePrice: "",
                purchasePrice: "",
                stock: "",
                minStock: "",
              });
              setIsModalOpen(true);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md bg-${primaryColor}-600 text-white hover:bg-${primaryColor}-700 hover:-translate-y-0.5`}
          >
            <Plus size={20} /> Add New Product
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div
        className={`p-4 rounded-xl border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between ${cardBg}`}
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className={textMuted} />
            </div>
            <input
              type="text"
              placeholder="Search by name or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:outline-none transition-all ${inputBg}`}
              style={{ borderColor: `var(--color-${primaryColor}-500)` }}
            />
          </div>
          <div className="relative w-full sm:w-44">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none font-medium cursor-pointer transition-all ${inputBg}`}
            >
              <option value="All">All Stock</option>
              <option value="Full">Full Stock</option>
              <option value="Medium">Medium Stock</option>
              <option value="Low">Low Stock</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className={textMuted} />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className={textMuted} />
            </div>
          </div>
        </div>
        <div className="flex gap-6 w-full md:w-auto justify-end">
          <div className="text-center md:text-right">
            <p className={`text-xs font-medium uppercase ${textMuted}`}>
              Total Items
            </p>
            <p className="text-xl font-bold">{products.length}</p>
          </div>
          <div className="text-center md:text-right">
            <p className={`text-xs font-medium uppercase text-red-500`}>
              Low Stock
            </p>
            <p className="text-xl font-bold text-red-500">
              {products.filter((p) => p.stock <= p.minStock).length}
            </p>
          </div>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b ${themeMode === "dark" ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"}`}
              >
                <th className="p-4 font-semibold text-sm">Product Name</th>
                <th className="p-4 font-semibold text-sm">Weight</th>
                <th className="p-4 font-semibold text-sm">Supplier</th>
                <th className="p-4 font-semibold text-sm">Sale Price</th>
                <th className="p-4 font-semibold text-sm">Stock Qty</th>
                <th className="p-4 font-semibold text-sm text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`p-8 text-center ${textMuted}`}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(
                    product.stock,
                    product.minStock,
                  );
                  return (
                    <tr
                      key={product.id}
                      className={`border-b transition-colors duration-150 ${themeMode === "dark" ? "border-gray-700" : "border-gray-100"} ${rowHover}`}
                    >
                      <td className="p-4 font-medium">{product.name}</td>
                      <td className={`p-4 text-sm ${textMuted}`}>
                        {product.weight || "---"}
                      </td>
                      <td className={`p-4 text-sm ${textMuted}`}>
                        {product.supplier}
                      </td>
                      <td className="p-4 font-semibold">
                        <span className="inline-flex items-center">
                          <IndianRupee size={14} className="mr-0.5" />{" "}
                          {product.salePrice}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.class}`}
                        >
                          {status.icon} {product.stock} ({status.label})
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(product)}
                            className={`p-1.5 rounded-lg transition-colors ${themeMode === "dark" ? "text-blue-400 hover:bg-blue-900/40" : "text-blue-600 hover:bg-blue-100"}`}
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className={`p-1.5 rounded-lg transition-colors ${themeMode === "dark" ? "text-red-400 hover:bg-red-900/40" : "text-red-600 hover:bg-red-100"}`}
                            title="Delete"
                          >
                            <Trash2 size={18} />
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

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl ${themeMode === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
          >
            <div
              className={`flex justify-between items-center p-6 border-b ${themeMode === "dark" ? "border-gray-700" : "border-gray-200"}`}
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <PackagePlus size={24} className={`text-${primaryColor}-500`} />
                {editingId ? "Edit Product" : "Add New Item"}
              </h2>
              <button
                onClick={closeModal}
                className={`p-2 rounded-full transition-colors ${themeMode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${textMuted}`}
                    >
                      Item Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                      placeholder="e.g. Tata Salt"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${textMuted}`}
                    >
                      Weight / Size
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                      placeholder="e.g. 1kg, 500g, 1L"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-1 ${textMuted}`}
                  >
                    Supplier Name
                  </label>
                  <div className="relative">
                    <select
                      name="supplierId"
                      value={formData.supplierId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none font-medium appearance-none cursor-pointer ${inputBg}`}
                    >
                      <option value="">-- Select Supplier (Optional) --</option>
                      <option value="NEW" className="text-emerald-500 font-bold">
                        ➕ Add New Supplier...
                      </option>
                      {suppliers.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                {formData.supplierId === "NEW" && (
                  <div className={`md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-xl border border-dashed border-emerald-500/40 transition-all duration-300 ${themeMode === "dark" ? "bg-emerald-950/10" : "bg-emerald-50/10"}`}>
                    <div>
                      <label
                        className={`block text-xs font-bold uppercase tracking-wider mb-1 text-emerald-500`}
                      >
                        New Supplier Name *
                      </label>
                      <input
                        type="text"
                        name="newSupplierName"
                        required
                        value={formData.newSupplierName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                        placeholder="e.g. Ramesh Distributors"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-bold uppercase tracking-wider mb-1 text-emerald-500`}
                      >
                        Supplier Phone Number
                      </label>
                      <input
                        type="text"
                        name="newSupplierPhone"
                        maxLength="10"
                        value={formData.newSupplierPhone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                        placeholder="10 digit phone number (Optional)"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${textMuted}`}
                  >
                    Purchase Price
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                    >
                      <IndianRupee size={16} />
                    </div>
                    <input
                      type="number"
                      name="purchasePrice"
                      required
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${textMuted}`}
                  >
                    Sale Price
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}
                    >
                      <IndianRupee size={16} />
                    </div>
                    <input
                      type="number"
                      name="salePrice"
                      required
                      value={formData.salePrice}
                      onChange={handleInputChange}
                      className={`w-full pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${textMuted}`}
                  >
                    Current Stock Qty
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${textMuted}`}
                  >
                    Min. Stock (Alert)
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    required
                    value={formData.minStock}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none ${inputBg}`}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
              <div
                className={`pt-5 border-t flex justify-end gap-3 ${themeMode === "dark" ? "border-gray-700" : "border-gray-200"}`}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all ${themeMode === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all bg-${primaryColor}-600 hover:bg-${primaryColor}-700 hover:-translate-y-0.5`}
                >
                  {editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* HIDDEN PRINT AREA FOR STOCK SHEET */}
      <div id="stock-print-area" className="hidden print:block p-8 font-mono text-[11px] leading-tight text-black bg-white">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
            🧾 Inventory Stock Report 🧾
          </h1>
          <p className="text-xs font-semibold">Generated on: {new Date().toLocaleString("en-IN")}</p>
          <div className="border-b-2 border-black my-4"></div>
        </div>

        {/* SUMMARY BOARD FOR AUDITING */}
        <div className="grid grid-cols-4 gap-4 mb-6 border p-3 bg-gray-50 rounded">
          <div>
            <span className="font-bold block">Total Items:</span>
            <span>{filteredProducts.length} unique</span>
          </div>
          <div>
            <span className="font-bold block">Total Stock Units:</span>
            <span>{filteredProducts.reduce((sum, p) => sum + p.stock, 0)} units</span>
          </div>
          <div>
            <span className="font-bold block">Purchase Valuation:</span>
            <span>₹{filteredProducts.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0).toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span className="font-bold block">Sales Valuation:</span>
            <span>₹{filteredProducts.reduce((sum, p) => sum + (p.salePrice * p.stock), 0).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* INVENTORY TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 font-bold w-8">#</th>
              <th className="py-2 font-bold">Item Name</th>
              <th className="py-2 font-bold w-16">Weight</th>
              <th className="py-2 font-bold">Supplier</th>
              <th className="py-2 font-bold text-right w-20">Kharidi Price</th>
              <th className="py-2 font-bold text-right w-20">Sale Price</th>
              <th className="py-2 font-bold text-right w-16">Stock</th>
              <th className="py-2 font-bold text-center w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, index) => {
              const isLow = p.stock <= p.minStock;
              return (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2 font-semibold">{p.name}</td>
                  <td className="py-2">{p.weight || "---"}</td>
                  <td className="py-2">{p.supplier || "Unknown"}</td>
                  <td className="py-2 text-right">₹{p.purchasePrice}</td>
                  <td className="py-2 text-right">₹{p.salePrice}</td>
                  <td className="py-2 text-right font-bold">{p.stock}</td>
                  <td className="py-2 text-center">
                    {isLow ? (
                      <span className="text-red-600 font-extrabold uppercase text-[9px]">⚠️ Low Stock</span>
                    ) : (
                      <span className="text-green-600 font-bold uppercase text-[9px]">OK</span>
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
            <span>Checked By / Audit Manager</span>
          </div>
          <div className="w-48 text-center border-t border-black pt-2">
            <span>Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
