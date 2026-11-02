import apiClient from './apiClient';

/** One page of orders: `{ content, page, size, totalElements, totalPages }`. Empty filters are not sent. */
export async function getAdminOrders({ status, q, from, to, page = 0, size = 20 } = {}) {
  const params = { page, size };
  if (status) params.status = status;
  if (q) params.q = q;
  if (from) params.from = from;
  if (to) params.to = to;
  const response = await apiClient.get('/admin/orders', { params });
  return response.data;
}

export async function updateAdminOrderStatus(orderRef, status) {
  const response = await apiClient.patch(`/admin/orders/${orderRef}/status`, { status });
  return response.data;
}

export async function getAdminOrder(orderRef) {
  const response = await apiClient.get(`/admin/orders/${orderRef}`);
  return response.data;
}

/** Staff-only note (max 1000 chars); a blank note clears it. Never shown to the customer. */
export async function updateAdminOrderNote(orderRef, note) {
  const response = await apiClient.put(`/admin/orders/${orderRef}/note`, { note });
  return response.data;
}

export async function markAdminOrderPaid(orderRef) {
  const response = await apiClient.patch(`/admin/orders/${orderRef}/payment/paid`);
  return response.data;
}
