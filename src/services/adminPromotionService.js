import apiClient from './apiClient';

export async function getCoupons() {
  return (await apiClient.get('/admin/coupons')).data;
}
export async function createCoupon(payload) {
  return (await apiClient.post('/admin/coupons', payload)).data;
}
export async function updateCoupon(id, payload) {
  return (await apiClient.put(`/admin/coupons/${id}`, payload)).data;
}
export async function setCouponActive(id, active) {
  return (await apiClient.patch(`/admin/coupons/${id}/status`, { active })).data;
}
export async function deleteCoupon(id) {
  await apiClient.delete(`/admin/coupons/${id}`);
}

export async function getSales() {
  return (await apiClient.get('/admin/sales')).data;
}
export async function createSale(payload) {
  return (await apiClient.post('/admin/sales', payload)).data;
}
export async function updateSale(id, payload) {
  return (await apiClient.put(`/admin/sales/${id}`, payload)).data;
}
export async function setSaleActive(id, active) {
  return (await apiClient.patch(`/admin/sales/${id}/status`, { active })).data;
}
export async function deleteSale(id) {
  await apiClient.delete(`/admin/sales/${id}`);
}
