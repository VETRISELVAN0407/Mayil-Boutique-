import apiClient from './apiClient';

export async function getWishlist() {
  const response = await apiClient.get('/customer/wishlist');
  return response.data;
}

export async function addToWishlist(productId) {
  const response = await apiClient.post('/customer/wishlist', { productId });
  return response.data;
}

export async function removeFromWishlist(productId) {
  await apiClient.delete(`/customer/wishlist/${productId}`);
}

export async function mergeWishlist(productIds) {
  const response = await apiClient.post('/customer/wishlist/merge', { productIds });
  return response.data;
}
