import useSettingsStore from "../store/settingsStore";
import { Store, Moon, Sun, Palette, Printer, ImagePlus, Trash2, Languages } from "lucide-react";
import { translations } from "../data/translations";

const Settings = () => {
  const {
    themeMode,
    toggleTheme,
    businessName,
    setBusinessName,
    primaryColor,
    setPrimaryColor,
    printerSize,
    setPrinterSize,
    logoUrl,
    setLogoUrl,
    nextInvoiceNumber,
    setNextInvoiceNumber,
    cin,
    setCin,
    gstin,
    setGstin,
    shopAddress,
    setShopAddress,
    website,
    setWebsite,
    supportEmail,
    setSupportEmail,
    supportPhone,
    setSupportPhone,
    fssai,
    setFssai,
    taxRate,
    setTaxRate,
    defaultDiscount,
    setDefaultDiscount,
    language,
    setLanguage,
  } = useSettingsStore();

  const t = translations[language || "en"] || translations.en;

  // App ke custom colors
  const themeColors = [
    { name: "Blue", value: "blue", bg: "bg-blue-600", text: "text-blue-600" },
    {
      name: "Green",
      value: "green",
      bg: "bg-green-600",
      text: "text-green-600",
    },
    {
      name: "Purple",
      value: "purple",
      bg: "bg-purple-600",
      text: "text-purple-600",
    },
    { name: "Rose", value: "rose", bg: "bg-rose-600", text: "text-rose-600" },
  ];

  // Logo upload handle karne ka function
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result); // Base64 mein save hoga taaki refresh pe udh na jaye
      };
      reader.readAsDataURL(file);
    }
  };

  // Dark/Light mode ke hisaab se card ka background
  const cardBg =
    themeMode === "dark"
      ? "bg-gray-800 border-gray-700 text-white"
      : "bg-white border-gray-200 text-gray-800";
  const inputBg =
    themeMode === "dark"
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
      : "bg-gray-50 border-gray-300 text-black placeholder-gray-400";

  return (
    <div
      className={`min-h-screen p-8 transition-all ${themeMode === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Store
          size={32}
          className={themeMode === "dark" ? "text-blue-400" : "text-blue-600"}
        />
        {t.appSettings}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* 1. Business Profile Card */}
        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Store size={20} /> {t.businessProfile}
          </h2>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              {t.businessName}
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
              placeholder="e.g. Sharma General Store"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              {t.nextInvoiceNumber}
            </label>
            <input
              type="number"
              min="1"
              value={nextInvoiceNumber}
              onChange={(e) => setNextInvoiceNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
              placeholder="e.g. 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.shopLogo}</label>

            {/* FIXED: Ab yeh poora div ek <label> ban chuka hai jo niche wale input id="logo-input" se linked hai */}
            <label
              htmlFor="logo-input"
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-${primaryColor}-500 ${inputBg}`}
            >
              {logoUrl ? (
                <div className="relative group flex flex-col items-center">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-20 object-contain mb-3 rounded-lg shadow-sm"
                  />
                  <div className="flex gap-4 items-center">
                    <span
                      className={`text-xs font-bold text-${primaryColor}-500 group-hover:underline`}
                    >
                      Change Image
                    </span>
                    <span className={themeMode === "dark" ? "text-gray-600" : "text-gray-300"}>|</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLogoUrl("");
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <ImagePlus size={40} className="mb-2 opacity-50" />
                  <span className="text-sm font-bold text-gray-500">
                    {t.uploadHelp}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">
                    {t.formatHelp}
                  </span>
                </>
              )}

              {/* Hidden the ugly default file input text but kept logic working */}
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* 2. Shopkeeper Info (Receipt Details) Card */}
        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Store size={20} className={`text-${primaryColor}-500`} /> {t.receiptDetails}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.cinNumber}</label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                placeholder="e.g. U74120MH2014PLC259234"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.gstinNumber}</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                placeholder="e.g. 27AANCA0090J1ZK"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.fssaiLicense}</label>
            <input
              type="text"
              value={fssai}
              onChange={(e) => setFssai(e.target.value)}
              className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
              placeholder="e.g. 11516013000245"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.shopAddress}</label>
            <textarea
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              rows="2"
              className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg} resize-none`}
              placeholder="e.g. Building No 2, Mansukh Industrial Estate, Mumbai - 400042"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.websiteUrl}</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                placeholder="e.g. smartinvoice.in"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.supportHelpline}</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
                placeholder="e.g. 022-62337171"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t.supportEmail}</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className={`w-full border p-3 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
              placeholder="e.g. support@smartinvoice.in"
            />
          </div>
        </div>

        {/* 3. Appearance & Theme Card */}
        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Palette size={20} /> {t.appearance}
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              {t.themeMode}
            </label>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                themeMode === "dark"
                  ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              {themeMode === "light" ? (
                <>
                  <Moon size={20} /> {t.switchToDark}
                </>
              ) : (
                <>
                  <Sun size={20} /> {t.switchToLight}
                </>
              )}
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
              <Languages size={18} className={`text-${primaryColor}-500`} /> {t.language}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: "English", value: "en" },
                { name: "हिंदी (Hindi)", value: "hi" },
                { name: "मराठी (Marathi)", value: "mr" },
                { name: "ગુજરાતી (Gujarati)", value: "gu" },
                { name: "বাংলা (Bengali)", value: "bn" },
                { name: "தமிழ் (Tamil)", value: "ta" },
                { name: "తెలుగు (Telugu)", value: "te" },
                { name: "ಕನ್ನಡ (Kannada)", value: "kn" },
                { name: "മലയാളം (Malayalam)", value: "ml" },
                { name: "ਪੰਜਾਬੀ (Punjabi)", value: "pa" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLanguage(lang.value)}
                  className={`py-2.5 px-3 rounded-lg border font-bold text-[11px] transition-all cursor-pointer truncate ${
                    language === lang.value
                      ? `bg-${primaryColor}-600 text-white border-${primaryColor}-600 shadow-sm`
                      : `${inputBg} hover:border-gray-400 ${themeMode === "dark" ? "border-gray-600" : "border-gray-300"}`
                  }`}
                  title={lang.name}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">
              {t.primaryColor}
            </label>
            <div className="flex gap-4">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${color.bg} ${
                    primaryColor === color.value
                      ? "ring-4 ring-offset-2 ring-gray-400"
                      : "hover:scale-110"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. Tax & Billing Settings Card */}
        <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Palette size={20} className={`text-${primaryColor}-500`} /> {t.taxBillingSettings}
          </h2>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">
              {t.defaultTaxPercent}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
              placeholder="e.g. 5"
            />
            <p className="text-[11px] text-gray-500 mt-1">{t.defaultTaxHelp}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.defaultDiscountPercent}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={defaultDiscount}
              onChange={(e) => setDefaultDiscount(e.target.value)}
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-${primaryColor}-500 ${inputBg}`}
              placeholder="e.g. 10"
            />
            <p className="text-[11px] text-gray-500 mt-1">{t.defaultDiscountHelp}</p>
          </div>
        </div>

        {/* 3. Printer Preferences Card */}
        <div
          className={`p-6 rounded-xl border shadow-sm md:col-span-2 ${cardBg}`}
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Printer size={20} /> {t.printerSettings}
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            {["A4", "80mm Thermal", "58mm Thermal"].map((size) => (
              <label
                key={size}
                className={`flex-1 border p-4 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                  printerSize === size
                    ? `border-${primaryColor}-500 bg-${primaryColor}-50 text-${primaryColor}-700 ring-1 ring-${primaryColor}-500`
                    : `${inputBg} hover:border-gray-400`
                }`}
              >
                <input
                  type="radio"
                  name="printer"
                  value={size}
                  checked={printerSize === size}
                  onChange={(e) => setPrinterSize(e.target.value)}
                  className="w-5 h-5"
                />
                <span className="font-medium">
                  {size} {size === "A4" ? t.paperStandard : t.receipt}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
