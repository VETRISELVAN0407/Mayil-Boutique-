import apiClient from './apiClient';

export async function getProducts() {
  const response = await apiClient.get('/admin/products');
  return response.data;
}

export async function getProduct(id) {
  const response = await apiClient.get(`/admin/products/${id}`);
  return response.data;
}

// Creating with pictures goes as multipart (JSON "product" part + one "images" part per file); otherwise plain JSON.
function toMultipart(payload, imageFiles) {
  const body = new FormData();
  body.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  imageFiles.forEach((file) => body.append('images', file));
  return body;
}

export async function createProduct(payload, imageFiles = []) {
  const response = imageFiles.length
    ? await apiClient.post('/admin/products', toMultipart(payload, imageFiles))
    : await apiClient.post('/admin/products', payload);
  return response.data;
}

/** Product details only; pictures are managed with the image calls below. */
export async function updateProduct(id, payload) {
  const response = await apiClient.put(`/admin/products/${id}`, payload);
  return response.data;
}

// The image calls all return the updated product: `images` is `[{ id, filename }]`, cover first.
export async function addProductImages(productId, imageFiles) {
  const body = new FormData();
  imageFiles.forEach((file) => body.append('images', file));
  const response = await apiClient.post(`/admin/products/${productId}/images`, body);
  return response.data;
}

export async function deleteProductImage(productId, imageId) {
  const response = await apiClient.delete(`/admin/products/${productId}/images/${imageId}`);
  return response.data;
}

/** `imageIds` lists every image of the product in the wanted order; the first becomes the cover. */
export async function reorderProductImages(productId, imageIds) {
  const response = await apiClient.put(`/admin/products/${productId}/images/order`, { imageIds });
  return response.data;
}

export async function updateProductStatus(id, status) {
  const response = await apiClient.patch(`/admin/products/${id}/status`, { status });
  return response.data;
}

export async function deleteProduct(id) {
  const response = await apiClient.delete(`/admin/products/${id}`);
  return response.data;
}

export async function getProductVariants(productId) {
  const response = await apiClient.get(`/admin/products/${productId}/variants`);
  return response.data;
}

export async function createProductVariant(productId, payload) {
  const response = await apiClient.post(`/admin/products/${productId}/variants`, payload);
  return response.data;
}

export async function updateProductVariant(productId, variantId, payload) {
  const response = await apiClient.put(`/admin/products/${productId}/variants/${variantId}`, payload);
  return response.data;
}

export async function deleteProductVariant(productId, variantId) {
  const response = await apiClient.delete(`/admin/products/${productId}/variants/${variantId}`);
  return response.data;
}

export async function updateProductVariantStock(productId, variantId, payload) {
  const response = await apiClient.patch(`/admin/products/${productId}/variants/${variantId}/stock`, payload);
  return response.data;
}

// Virtual Try-On: admin settings per product, and the public list of products that are enabled and ready.
export async function getTryOnConfig(productId) {
  const response = await apiClient.get(`/admin/products/${productId}/try-on`);
  return response.data;
}

/** `{ providerConfigured, supportedGarmentTypes }`: what the connected engine can really handle. */
export async function getTryOnCapabilities() {
  const response = await apiClient.get('/admin/try-on/capabilities');
  return response.data;
}

export async function updateTryOnConfig(productId, payload) {
  const response = await apiClient.put(`/admin/products/${productId}/try-on`, payload);
  return response.data;
}

/** `[{ product, garmentType, primaryImageId }]`; `product` has the same shape as the other public products. */
export async function getTryOnProducts(params) {
  const response = await apiClient.get('/products/try-on', { params });
  return response.data;
}

export async function getTryOnProduct(productId) {
  const response = await apiClient.get(`/products/try-on/${productId}`);
  return response.data;
}

export async function getPublicProducts(params) {
  const response = await apiClient.get('/products/public', { params });
  return response.data;
}

export async function getPublicProductBySlug(slug) {
  const response = await apiClient.get(`/products/public/${slug}`);
  return response.data;
}

export async function getPublicProductVariantsBySlug(slug) {
  const response = await apiClient.get(`/products/public/${slug}/variants`);
  return response.data;
}
