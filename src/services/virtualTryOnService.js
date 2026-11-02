import apiClient from './apiClient';
import * as productService from './productService';

// Public catalogue side (no sign-in): which products can be tried on.
export async function getAvailability() {
  const response = await apiClient.get('/products/try-on/status');
  return response.data.available === true;
}

export const getTryOnProducts = productService.getTryOnProducts;
export const getTryOnProduct = productService.getTryOnProduct;

// Customer side (sign-in required). A job: { id, productId, productName, status, errorMessage, resultAvailable, expiresAt }.
// status is PENDING | PROCESSING | COMPLETED | FAILED | EXPIRED | CANCELLED.
export async function createJob(productId, photoBlob, consent) {
  const body = new FormData();
  body.append('photo', photoBlob, 'photo.jpg');
  const response = await apiClient.post('/customer/try-on/jobs', body, { params: { productId, consent } });
  return response.data;
}

export async function getJob(jobId) {
  const response = await apiClient.get(`/customer/try-on/jobs/${jobId}`);
  return response.data;
}

/** The generated picture is private, so it is fetched with the sign-in token and shown from a local blob URL. */
export async function getResultBlob(jobId) {
  const response = await apiClient.get(`/customer/try-on/jobs/${jobId}/result`, { responseType: 'blob' });
  return response.data;
}

export async function deleteJob(jobId) {
  await apiClient.delete(`/customer/try-on/jobs/${jobId}`);
}
