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
  setBaseURL,
};
