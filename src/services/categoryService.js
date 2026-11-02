import apiClient from './apiClient';

export async function getPublicCategories() {
  const response = await apiClient.get('/categories/public');
  return response.data;
}

export async function getCategories() {
  const response = await apiClient.get('/admin/categories');
  return response.data;
}

export async function getCategory(id) {
  const response = await apiClient.get(`/admin/categories/${id}`);
  return response.data;
}

export async function createCategory(payload) {
  const response = await apiClient.post('/admin/categories', payload);
  return response.data;
}

export async function updateCategory(id, payload) {
  const response = await apiClient.put(`/admin/categories/${id}`, payload);
  return response.data;
}

/** Uploads (or replaces) the category picture; returns the updated category. */
export async function setCategoryImage(id, file) {
  const body = new FormData();
  body.append('image', file);
  const response = await apiClient.put(`/admin/categories/${id}/image`, body);
  return response.data;
}

export async function removeCategoryImage(id) {
  const response = await apiClient.delete(`/admin/categories/${id}/image`);
  return response.data;
}

export async function updateCategoryStatus(id, status) {
  const response = await apiClient.patch(`/admin/categories/${id}/status`, { status });
  return response.data;
}

export async function deleteCategory(id) {
  const response = await apiClient.delete(`/admin/categories/${id}`);
  return response.data;
}
