import client from "./client";

export const getProducts = async () => {
  const { data } = await client.get("/products");
  return data;
};

export const createProduct = async (payload) => {
  const { data } = await client.post("/products", payload);
  return data;
};

export const updateProduct = async (id, payload) => {
  const { data } = await client.put(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await client.delete(`/products/${id}`);
  return data;
};

export const getCustomers = async () => {
  const { data } = await client.get("/customers");
  return data;
};

export const createCustomer = async (payload) => {
  const { data } = await client.post("/customers", payload);
  return data;
};

export const updateCustomer = async (id, payload) => {
  const { data } = await client.put(`/customers/${id}`, payload);
  return data;
};

export const deleteCustomer = async (id) => {
  const { data } = await client.delete(`/customers/${id}`);
  return data;
};

export const getSuppliers = async () => {
  const { data } = await client.get("/suppliers");
  return data;
};

export const createSupplier = async (payload) => {
  const { data } = await client.post("/suppliers", payload);
  return data;
};

export const updateSupplier = async (id, payload) => {
  const { data } = await client.put(`/suppliers/${id}`, payload);
  return data;
};

export const deleteSupplier = async (id) => {
  const { data } = await client.delete(`/suppliers/${id}`);
  return data;
};

export const getExpenses = async () => {
  const { data } = await client.get("/expenses");
  return data;
};

export const createExpense = async (payload) => {
  const { data } = await client.post("/expenses", payload);
  return data;
};

export const updateExpense = async (id, payload) => {
  const { data } = await client.put(`/expenses/${id}`, payload);
  return data;
};

export const deleteExpense = async (id) => {
  const { data } = await client.delete(`/expenses/${id}`);
  return data;
};

export const setBaseURL = (url) => {
  client.defaults.baseURL = url;
};

export const getInvoices = async () => {
  const { data } = await client.get("/invoices");
  return data;
};

export const createInvoice = async (payload) => {
  const { data } = await client.post("/invoices", payload);
  return data;
};

export const deleteInvoice = async (id) => {
  const { data } = await client.delete(`/invoices/${id}`);
  return data;
};

export const parseVoiceBilling = async (userQuery) => {
  const { data } = await client.post("/ai/voice-billing", { userQuery });
  return data;
};

export const askKhataBot = async (userQuery) => {
  const { data } = await client.post("/ai/khata-bot", { userQuery });
  return data;
};

export const getInventoryPrediction = async () => {
  const { data } = await client.post("/ai/inventory-prediction");
  return data;
};

export const getBankAccounts = async () => {
  const { data } = await client.get("/banks");
  return data;
};

export const createBankAccount = async (payload) => {
  const { data } = await client.post("/banks", payload);
  return data;
};

export const updateBankAccount = async (id, payload) => {
  const { data } = await client.put(`/banks/${id}`, payload);
  return data;
};

export const getBankTransactions = async () => {
  const { data } = await client.get("/banks/transactions");
  return data;
};

export const createBankTransaction = async (payload) => {
  const { data } = await client.post("/banks/transactions", payload);
  return data;
};

export const updateChequeStatus = async (id, status) => {
  const { data } = await client.put(`/banks/transactions/${id}/cheque`, { status });
  return data;
};

export const getCashFlowMetrics = async () => {
  const { data } = await client.get("/reports/cash-flow");
  return data;
};

export default {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getInvoices,
  createInvoice,
  deleteInvoice,
  parseVoiceBilling,
  askKhataBot,
  getInventoryPrediction,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  getBankTransactions,
  createBankTransaction,
  updateChequeStatus,
  getCashFlowMetrics,
  setBaseURL,
};
