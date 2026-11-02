import apiClient from './apiClient';

/** One page of customers: `{ content, page, size, totalElements, totalPages }`. */
export async function getAdminCustomers({ q, page = 0, size = 20 } = {}) {
  const params = { page, size };
  if (q) params.q = q;
  const response = await apiClient.get('/admin/customers', { params });
  return response.data;
}

/** `{ customer, orders }` */
export async function getAdminCustomer(id) {
  const response = await apiClient.get(`/admin/customers/${id}`);
  return response.data;
}
