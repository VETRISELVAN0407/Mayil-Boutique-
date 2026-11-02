import apiClient from './apiClient';

export async function placeOrder(addressId, couponCode) {
  const response = await apiClient.post('/customer/orders', couponCode ? { addressId, couponCode } : { addressId });
  return response.data;
}

export async function getOrders() {
  const response = await apiClient.get('/customer/orders');
  return response.data;
}

export async function getOrder(orderRef) {
  const response = await apiClient.get(`/customer/orders/${orderRef}`);
  return response.data;
}

export async function requestReturn(orderRef, reason) {
  const response = await apiClient.post(`/customer/orders/${orderRef}/return`, { reason });
  return response.data;
}

export async function cancelOrder(orderRef) {
  const response = await apiClient.post(`/customer/orders/${orderRef}/cancel`);
  return response.data;
}
