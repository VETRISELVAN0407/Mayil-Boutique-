import apiClient from './apiClient';

export async function loginAdmin(mobile, password) {
  const response = await apiClient.post('/auth/admin/login', { mobile, password });
  return response.data;
}

export async function logoutAdmin(refreshToken) {
  const response = await apiClient.post('/auth/admin/logout', { refreshToken });
  return response.data;
}

/** Returns a fresh `{ accessToken, refreshToken }`; every other session of this admin is ended. */
export async function changeAdminPassword(currentPassword, newPassword) {
  const response = await apiClient.post('/admin/account/password', { currentPassword, newPassword });
  return response.data;
}

export async function getDashboardSummary() {
  const response = await apiClient.get('/admin/dashboard/summary');
  return response.data;
}

export async function requestCustomerOtp(mobile) {
  const response = await apiClient.post('/auth/customer/otp/request', { mobile });
  return response.data;
}

export async function verifyCustomerOtp(mobile, code) {
  const response = await apiClient.post('/auth/customer/otp/verify', { mobile, code });
  return response.data;
}

export async function logoutCustomer(refreshToken) {
  await apiClient.post('/auth/customer/logout', { refreshToken });
}
