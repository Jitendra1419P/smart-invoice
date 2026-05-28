import { create } from "zustand";
// 1. Memory persistence ke liye Zustand ka middleware import kiya
import { persist } from "zustand/middleware";

const useSettingsStore = create(
  persist(
    (set) => ({
      // 1. Memory Variables
      themeMode: "light",
      primaryColor: "blue", // 'blue', 'green', 'purple', 'rose'
      businessName: "My Shop",
      printerSize: "A4", // 'A4', '80mm', '58mm'
      logoUrl: "", // Logo ka data save karne ke liye
      nextInvoiceNumber: 1, // Invoice start counter
      cin: "",
      gstin: "",
      shopAddress: "",
      website: "",
      supportEmail: "",
      supportPhone: "",
      fssai: "",
      taxRate: 5, // Default tax percentage (5%)
      defaultDiscount: 0, // Default flat discount (0)
      language: "en", // Default language (English)

      // 2. Action Functions (Aapka purana toggle function bilkul safe hai)
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setBusinessName: (name) => set({ businessName: name }),
      setPrinterSize: (size) => set({ printerSize: size }),
      setLogoUrl: (url) => set({ logoUrl: url }),
      setNextInvoiceNumber: (num) => set({ nextInvoiceNumber: num }),
      setCin: (val) => set({ cin: val }),
      setGstin: (val) => set({ gstin: val }),
      setShopAddress: (val) => set({ shopAddress: val }),
      setWebsite: (val) => set({ website: val }),
      setSupportEmail: (val) => set({ supportEmail: val }),
      setSupportPhone: (val) => set({ supportPhone: val }),
      setFssai: (val) => set({ fssai: val }),
      setTaxRate: (val) => set({ taxRate: Math.max(0, parseFloat(val) || 0) }),
      setDefaultDiscount: (val) => set({ defaultDiscount: Math.max(0, parseFloat(val) || 0) }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      // 2. Browser ki localStorage mein data save karne ke liye unique key naam diya
      name: "smart-invoice-settings",
    },
  ),
);

export default useSettingsStore;
