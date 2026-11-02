/* Formatting helpers used across storefront pages */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount) {
  return INR.format(amount);
}

export function formatDate(isoString, opts = {}) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...opts,
  });
}

export function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatOrderStatus(status) {
  const map = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    PACKED: 'Packed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    RETURN_REQUESTED: 'Return Requested',
    RETURNED: 'Returned',
    REFUND_PENDING: 'Refund Pending',
    REFUNDED: 'Refunded',
  };
  return map[status] || status;
}

export function formatPaymentMethod(method) {
  return method === 'COD' ? 'Cash on Delivery' : method;
}

export function formatPaymentStatus(status) {
  const map = {
    PENDING: 'Pending',
    COD_PENDING: 'Pay on Delivery',
    PAID: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return map[status] || status;
}

export function truncate(str, max = 80) {
  if (!str || str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}
