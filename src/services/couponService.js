import apiClient from './apiClient';

/** Checks a code against the signed-in customer's cart: `{ code, subtotal, discount, total, ... }`. */
export async function validateCoupon(code) {
  const response = await apiClient.post('/customer/coupons/validate', { code });
  return response.data;
}
