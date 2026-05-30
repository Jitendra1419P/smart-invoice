import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  Package,
  Users,
  Truck,
  Wallet,
  Settings as SettingsIcon,
  Store,
  History,
  Landmark,
} from "lucide-react";
import useSettingsStore from "../store/settingsStore";
import { translations } from "../data/translations";

const MainLayout = () => {
  const location = useLocation();
  const { themeMode, businessName, primaryColor, logoUrl, language } = useSettingsStore();
  const t = translations[language || "en"] || translations.en;

  const themeStyles = {
    blue: {
      activeBg:
        themeMode === "dark"
          ? "bg-blue-900/40 text-blue-400"
          : "bg-blue-50 text-blue-700",
      border: "border-blue-500",
      text: "text-blue-500",
    },
    green: {
      activeBg:
        themeMode === "dark"
          ? "bg-green-900/40 text-green-400"
          : "bg-green-50 text-green-700",
      border: "border-green-500",
      text: "text-green-500",
    },
    purple: {
      activeBg:
        themeMode === "dark"
          ? "bg-purple-900/40 text-purple-400"
          : "bg-purple-50 text-purple-700",
      border: "border-purple-500",
      text: "text-purple-500",
    },
    rose: {
      activeBg:
        themeMode === "dark"
          ? "bg-rose-900/40 text-rose-400"
          : "bg-rose-50 text-rose-700",
      border: "border-rose-500",
      text: "text-rose-500",
    },
  };

  const currentStyle = themeStyles[primaryColor] || themeStyles.blue;

  const isActive = (path) => {
    if (location.pathname === path)
      return `${currentStyle.activeBg} border-r-4 ${currentStyle.border}`;
    return themeMode === "dark"
      ? "text-gray-400 hover:bg-gray-800 hover:text-white"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  };

  const sidebarBg =
    themeMode === "dark"
      ? "bg-gray-900 border-gray-800"
      : "bg-white border-gray-200";
  const mainBg =
    themeMode === "dark"
      ? "bg-gray-950 text-white print:bg-white print:text-black"
      : "bg-gray-50 text-gray-900 print:bg-white print:text-black";
  return (
    <div className={`flex h-screen transition-colors duration-300 ${mainBg}`}>
      {/* Left Sidebar - Yahan humne 'print:hidden' lagaya hai */}
      <div
        className={`w-64 border-r shadow-sm flex flex-col transition-colors duration-300 print:hidden ${sidebarBg}`}
      >
        <div className="p-6 border-b border-opacity-10 border-gray-500 flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-8 w-8 object-contain rounded"
            />
          ) : (
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center bg-opacity-20 ${currentStyle.activeBg}`}
            >
              <Store size={20} className={currentStyle.text} />
            </div>
          )}
          <h2
            className={`text-xl font-bold tracking-tight truncate ${currentStyle.text}`}
          >
            {businessName || "SmartInvoice"}
          </h2>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/")}`}
          >
            <LayoutDashboard size={20} /> {t.dashboard}
          </Link>
          <Link
            to="/pos"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/pos")}`}
          >
            <ReceiptText size={20} /> {t.createBill}
          </Link>
          <Link
            to="/invoices"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/invoices")}`}
          >
            <History size={20} /> {t.billHistory}
          </Link>
          <Link
            to="/products"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/products")}`}
          >
            <Package size={20} /> {t.products}
          </Link>
          <Link
            to="/customers"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/customers")}`}
          >
            <Users size={20} /> {t.customers}
          </Link>
          <Link
            to="/suppliers"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/suppliers")}`}
          >
            <Truck size={20} /> {t.suppliers}
          </Link>
          <Link
            to="/expenses"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/expenses")}`}
          >
            <Wallet size={20} /> {t.expenses}
          </Link>
          <Link
            to="/banking"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/banking")}`}
          >
            <Landmark size={20} /> {t.banking || "Banking"}
          </Link>
        </nav>

        <div className="p-4 border-t border-opacity-10 border-gray-500">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${isActive("/settings")}`}
          >
            <SettingsIcon size={20} /> {t.settings}
          </Link>
        </div>
      </div>

      {/* Main Content Area - Print ke time overflow visible kiya hai */}
      <div className="flex-1 overflow-auto print:overflow-visible">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
