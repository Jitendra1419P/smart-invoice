import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import useSettingsStore from "./store/settingsStore";
import "./App.css";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Expenses from "./pages/Expenses";
import Suppliers from "./pages/Suppliers";
import InvoiceHistory from "./pages/InvoiceHistory";

function App() {
  const { themeMode } = useSettingsStore();

  useEffect(() => {
    // Page load hote hi check karega aur HTML par class trigger karega
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [themeMode]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="invoices" element={<InvoiceHistory />} />
          <Route path="settings" element={<Settings />} />
          <Route path="products" element={<Products />} />
          <Route path="customers" element={<Customers />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="suppliers" element={<Suppliers />} />
          {/* 
          <Route path="reports" element={<Reports />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
