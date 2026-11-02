import { Link, useParams } from 'react-router-dom';
import { useOrderByRef } from '../hooks/useOrderByRef';
import PageShell from '../components/ui/PageShell';
import ProductImage from '../components/ui/ProductImage';
import { productImageUrl } from '../utils/catalog';
import { formatCurrency, formatDate, formatPaymentMethod } from '../utils/format';

export default function OrderSuccessPage() {
  const { orderId: orderRef } = useParams();
  const { loading, order } = useOrderByRef(orderRef);

  if (loading) {
    return (
      <PageShell center title="Order Placed">
        <div className="skeleton mx-auto h-64 w-full max-w-2xl" />
      </PageShell>
    );
  }

  if (!order) {
    return (
      <PageShell center title="Order not found">
        <div className="text-center">
          <Link to="/" className="btn-green">Back to Home</Link>
        </div>
      </PageShell>
    );
  }

  const address = order.shippingAddress;

  return (
    <PageShell center title="Order Placed!" subtitle="Thank you for shopping with Mayil Boutique">
      <div className="card-cream mx-auto max-w-2xl p-6 text-center sm:p-8">
        <div className="w-16 h-16 rounded-full bg-[#128a3e]/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-[#128a3e]">✓</span>
        </div>
        <p className="text-xs text-brand-secondary">
          Placed on {formatDate(order.createdAt)}
        </p>

        <div className="mt-6 rounded-lg border border-[#E8E0D3] bg-white p-4 text-left">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8a6d2f]">Order ID</span>
            <span className="font-mono text-sm font-semibold text-[#0f3d2e]">{order.orderRef}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8a6d2f]">Amount to Pay</span>
            <span className="font-semibold text-[#0f3d2e]">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Items */}
        <div className="mt-4 divide-y divide-[#E8E0D3] text-left">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 py-3 items-center">
              <div className="w-12 h-16 flex-shrink-0 overflow-hidden rounded bg-[#f3ede2]">
                <ProductImage src={productImageUrl(item.imageFilename)} alt={item.productName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-primary line-clamp-1">{item.productName}</p>
                <p className="text-xs text-brand-secondary mt-0.5">
                  {item.size && `Size: ${item.size}`}{item.colour && ` · ${item.colour}`} · Qty: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#0f3d2e]">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 text-left border-t border-[#E8E0D3] pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-secondary">Delivery to</span>
            <span className="text-brand-primary text-right max-w-[60%]">
              {address.name}, {address.city}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-secondary">Payment</span>
            <span className="text-brand-primary">{formatPaymentMethod(order.paymentMethod)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/invoice/${order.orderRef}`} className="btn-green-outline">
            View Invoice
          </Link>
          <Link to="/account/orders" className="btn-green-outline">
            My Orders
          </Link>
          <Link to="/products" className="btn-green">
            Continue Shopping
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
