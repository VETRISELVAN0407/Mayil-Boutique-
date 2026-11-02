import apiClient from './apiClient';

export async function getCart() {
  const response = await apiClient.get('/customer/cart');
  return response.data;
}

export async function addToCart(variantId, quantity = 1) {
  const response = await apiClient.post('/customer/cart', { variantId, quantity });
  return response.data;
}

export async function updateCartItem(variantId, quantity) {
  const response = await apiClient.put(`/customer/cart/${variantId}`, { quantity });
  return response.data;
}

export async function removeFromCart(variantId) {
  await apiClient.delete(`/customer/cart/${variantId}`);
}

export async function mergeCart(items) {
  const response = await apiClient.post('/customer/cart/merge', { items });
  return response.data;
}
