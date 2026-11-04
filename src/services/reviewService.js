import apiClient from './apiClient';

/** Reviews of a product plus the viewer's own state (`canReview`, `myReview`) when a customer is signed in. */
export async function getReviews(slug, sort = 'helpful') {
  const response = await apiClient.get(`/products/public/${slug}/reviews`, { params: { sort } });
  return response.data;
}

export async function createReview({ productId, rating, comment }) {
  const response = await apiClient.post('/customer/reviews', { productId, rating, comment });
  return response.data;
}

export async function updateReview(id, { productId, rating, comment }) {
  const response = await apiClient.put(`/customer/reviews/${id}`, { productId, rating, comment });
  return response.data;
}

export async function deleteReview(id) {
  await apiClient.delete(`/customer/reviews/${id}`);
}

/** Toggles the "helpful" vote; returns `{ helpfulCount, helpfulByMe }`. */
export async function toggleHelpful(id) {
  const response = await apiClient.post(`/customer/reviews/${id}/helpful`);
  return response.data;
}
