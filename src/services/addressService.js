import apiClient from './apiClient';

export async function getAddresses() {
  const response = await apiClient.get('/customer/addresses');
  return response.data;
}

export async function createAddress(address) {
  const response = await apiClient.post('/customer/addresses', address);
  return response.data;
}

export async function updateAddress(id, address) {
  const response = await apiClient.put(`/customer/addresses/${id}`, address);
  return response.data;
}

export async function setDefaultAddress(id) {
  const response = await apiClient.patch(`/customer/addresses/${id}/default`);
  return response.data;
}

export async function deleteAddress(id) {
  await apiClient.delete(`/customer/addresses/${id}`);
}
