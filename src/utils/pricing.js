/* Pricing helpers shared between cart, checkout, and order pages */
import { effectivePrice } from './catalog';

export function discountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/** Cart lines carry price + optional salePrice; the sale price wins when set. */
export function lineTotal(item) {
  return effectivePrice(item) * (item.quantity ?? 1);
}

export function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}
