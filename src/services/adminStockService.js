import apiClient from './apiClient';

/** Adds `quantity` units to a variant. Returns the history row, including the new `totalStock`. */
export async function addStock({ productId, variantId, quantity }) {
  const response = await apiClient.post('/admin/stock-updates', { productId, variantId, quantity });
  return response.data;
}

/** One page of variants of published products with stock <= threshold, lowest first (same paged shape). */
export async function getLowStock({ threshold = 5, page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/admin/stock-updates/low-stock', { params: { threshold, page, size } });
  return response.data;
}

/** One page of stock history, newest first: `{ content, page, size, totalElements, totalPages }`. */
export async function getStockHistory({ page = 0, size = 10 } = {}) {
  const response = await apiClient.get('/admin/stock-updates', { params: { page, size } });
  return response.data;
}
