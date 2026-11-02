import { useParams, Link } from 'react-router-dom';
import { useOrderByRef } from '../hooks/useOrderByRef';
import { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } from '../utils/format';
import { STORE_INFO } from '../config/store';

export default function InvoicePage() {
  const { orderId } = useParams();
  const { loading, order } = useOrderByRef(orderId);

  if (loading) {
    return (
      <div className="page-container py-8 max-w-3xl">
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container py-20 text-center">
        <p className="text-brand-secondary">Invoice not found.</p>
        <Link to="/account/orders" className="btn-primary mt-6 inline-flex">My Orders</Link>
      </div>
    );
  }

  return (
    <div className="page-container py-8 max-w-3xl">
      <div className="no-print flex items-center gap-4 mb-6">
        <Link to="/account/orders" className="btn-ghost text-sm text-brand-secondary">← Orders</Link>
        <button onClick={() => window.print()} className="btn-outline ml-auto py-2 px-4 text-sm">
          Print / Save PDF
        </button>
      </div>

      <div className="invoice-print bg-white shadow-card p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-peacock-deep">{STORE_INFO.name}</h1>
            <p className="text-xs text-brand-secondary mt-1 leading-relaxed">
              {STORE_INFO.address}<br />
              {STORE_INFO.email} · {STORE_INFO.phone}
            </p>
          </div>
          <div className="text-right">
            <h2 className="font-serif text-xl font-semibold text-brand-primary">INVOICE</h2>
            <p className="font-mono text-sm text-brand-secondary mt-1">{order.orderRef}</p>
            <p className="text-xs text-brand-secondary mt-1">{formatDateTime(order.createdAt)}</p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-success/10 text-success text-xs font-semibold uppercase tracking-wide">
              {formatPaymentStatus(order.paymentStatus)}
            </span>
          </div>
        </div>

        <div className="h-px bg-brand-border mb-6" />

        {/* Billing / Shipping */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-2">Billed To</h3>
            <p className="text-sm font-semibold text-brand-primary">{order.shippingAddress.name}</p>
            <p className="text-xs text-brand-secondary leading-relaxed mt-1">
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
              {order.shippingAddress.mobile}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-2">Payment</h3>
            <p className="text-sm text-brand-primary">{formatPaymentMethod(order.paymentMethod)}</p>
            <p className="text-xs text-brand-secondary mt-1">Status: {formatPaymentStatus(order.paymentStatus)}</p>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-peacock-deep">
              <th className="text-left text-xs font-semibold uppercase tracking-widest text-peacock-deep pb-2">Product</th>
              <th className="text-center text-xs font-semibold uppercase tracking-widest text-peacock-deep pb-2">Qty</th>
              <th className="text-right text-xs font-semibold uppercase tracking-widest text-peacock-deep pb-2">Price</th>
              <th className="text-right text-xs font-semibold uppercase tracking-widest text-peacock-deep pb-2">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 pr-4">
                  <p className="font-medium text-brand-primary">{item.productName}</p>
                  {item.size && (
                    <p className="text-xs text-brand-secondary mt-0.5">
                      {item.size}{item.colour ? ` · ${item.colour}` : ''} · SKU: {item.sku || '—'}
                    </p>
                  )}
                </td>
                <td className="text-center py-3">{item.quantity}</td>
                <td className="text-right py-3">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right py-3 font-semibold">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-secondary">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>−{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-secondary">Shipping</span>
              <span>{Number(order.shippingTotal) === 0 ? 'Free' : formatCurrency(order.shippingTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-peacock-deep pt-2 mt-1">
              <span>Total</span>
              <span className="text-peacock-deep">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-brand-border mt-8 mb-4" />

        <p className="text-xs text-brand-secondary text-center leading-relaxed">
          Thank you for shopping with {STORE_INFO.name}.<br />
          For returns or queries, contact us at {STORE_INFO.email}<br />
          <strong>GST:</strong> {STORE_INFO.gst}
        </p>
      </div>
    </div>
  );
}
