/* Maps API product/category payloads to the shape the storefront components render. */

import { BASE_URL } from '../services/apiClient';

const NEW_WINDOW_DAYS = 14;

export function effectivePrice(item) {
  return Number(item.salePrice ?? item.price ?? 0);
}

/* Product images are served by the backend; the API only returns the stored filename. */
export function productImageUrl(filename) {
  return filename ? `${BASE_URL}/products/images/${encodeURIComponent(filename)}` : null;
}

export function normalizeProduct(product, categoriesById = {}) {
  const category = categoriesById[product.categoryId];
  const hasSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const ageDays = product.createdAt ? (Date.now() - new Date(product.createdAt).getTime()) / 86400000 : Infinity;
  return {
    ...product,
    price: hasSale ? Number(product.salePrice) : Number(product.price),
    originalPrice: hasSale ? Number(product.price) : null,
    categoryName: category?.name ?? '',
    categorySlug: category?.slug ?? '',
    // The API lists every image, cover first, as { id, filename }; the storefront wants ready-to-use URLs.
    images: (product.images ?? []).map((image) => productImageUrl(image.filename)),
    isNew: ageDays <= NEW_WINDOW_DAYS,
  };
}

/* An uploaded picture wins over the older free-text image URL. */
export function categoryImageUrl(category) {
  return productImageUrl(category.imageFilename) || category.image || null;
}

export function normalizeCategories(categories) {
  return (categories ?? []).map((category) => ({ ...category, image: categoryImageUrl(category) }));
}

export function indexById(list) {
  return Object.fromEntries(list.map((item) => [item.id, item]));
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  // No response at all means the request never reached the API (server down, proxy error, offline).
  if (error && !error.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  return error?.response?.data?.message || fallback;
}
