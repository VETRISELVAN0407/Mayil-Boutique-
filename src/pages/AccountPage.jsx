import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as orderService from '../services/orderService';
import PageShell, { EmptyPanel } from '../components/ui/PageShell';
import ProductImage from '../components/ui/ProductImage';
import OrderTimeline from '../components/ui/OrderTimeline';
import { errorMessage, productImageUrl } from '../utils/catalog';
import { formatCurrency, formatDate, formatOrderStatus, formatPaymentMethod } from '../utils/format';

const STATUS_COLORS = {
  DELIVERED: 'text-[#0f5a3f] bg-[#128a3e]/10',
  SHIPPED: 'text-peacock-teal bg-peacock-teal/10',
  CONFIRMED: 'text-peacock-blue bg-peacock-blue/10',
  PENDING: 'text-[#8a6d2f] bg-[#E3BF72]/25',
  CANCELLED: 'text-brand-sale bg-brand-sale/10',
};

const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: '#b08d47', strokeWidth: 1.6, strokeLinejoin: 'round', strokeLinecap: 'round' };
const NAV_ITEMS = [
  { label: 'My Orders', to: '/account/orders', icon: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5 12 12l8-4.5M12 12v9" /> },
  { label: 'Wishlist', to: '/wishlist', icon: <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" /> },
  { label: 'Shopping Bag', to: '/cart', icon: <><path d="M5 8h14l1 13H4L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></> },
  { label: 'Contact Us', to: '/contact', icon: <path d="M4 5h16v11H9l-5 4z" /> },
];

const CANCELLABLE = ['PENDING', 'CONFIRMED'];

export default function AccountPage() {
  const { customer, isLoggedIn, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [confirmRef, setConfirmRef] = useState(null);
  const [returnRef, setReturnRef] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await orderService.getOrders());
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your orders.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadOrders();
  }, [isLoggedIn, loadOrders]);

  // Pick up status changes made by the shop (confirmed, packed, shipped...) without a page reload.
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const refresh = () => {
      if (document.visibilityState === 'visible') loadOrders();
    };
    const timer = setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isLoggedIn, loadOrders]);

  async function handleCancel(orderRef) {
    setCancelling(orderRef);
    try {
      const updated = await orderService.cancelOrder(orderRef);
      setOrders((prev) => prev.map((o) => (o.orderRef === orderRef ? updated : o)));
      toast.success('Order cancelled.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCancelling(null);
      setConfirmRef(null);
    }
  }

  async function handleReturn(orderRef) {
    const reason = returnReason.trim();
    if (!reason) {
      toast.error('Please tell us why you are returning this order.');
      return;
    }
    setReturning(orderRef);
    try {
      const updated = await orderService.requestReturn(orderRef, reason);
      setOrders((prev) => prev.map((o) => (o.orderRef === orderRef ? updated : o)));
      toast.success('Return requested. We will contact you shortly.');
      setReturnRef(null);
      setReturnReason('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setReturning(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  if (!isLoggedIn) {
    return (
      <PageShell crumb="My Account" title="My Account">
        <EmptyPanel
          title="Sign in to view your account"
          description="Access your orders, wishlist, and account details."
          actionLabel="Sign In"
          actionTo="/login"
        />
      </PageShell>
    );
  }

  return (
    <PageShell crumb="My Account" title="My Account" subtitle={`+91 ${customer.mobile}`}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[18.125rem_1fr]">
        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[7.5rem]">
          <div className="card-cream p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#0f3d2e]">
              <span className="font-serif text-2xl text-[#E3BF72]">M</span>
            </div>
            <h2 className="font-serif text-xl text-[#0f3d2e]">Welcome back</h2>
            <p className="mt-1 text-xs text-[#4a4a3f]">+91 {customer.mobile}</p>
          </div>
          <nav className="card-cream divide-y divide-[#E8E0D3] overflow-hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-5 py-3.5 font-serif text-[1rem] text-[#10241d] transition-colors hover:bg-white/70 hover:text-[#0f5a3f]"
              >
                <svg {...ICON}>{item.icon}</svg>
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left font-serif text-[1rem] text-brand-sale transition-colors hover:bg-white/70"
            >
              <svg {...ICON} stroke="#a43d42"><path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" /></svg>
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Orders */}
        <div className="min-w-0">
          <h2 className="type-section mb-5 font-serif text-[#0f3d2e]">My Orders</h2>
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-32 w-full" />
              <div className="skeleton h-32 w-full" />
            </div>
          ) : error ? (
            <div className="card-cream p-12 text-center">
              <p className="text-sm text-brand-sale">{error}</p>
              <button onClick={loadOrders} className="btn-green-outline mt-4">Try again</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="card-cream p-12 text-center">
              <p className="font-serif text-xl text-[#0f3d2e]">No orders yet</p>
              <p className="mt-1 text-sm text-[#4a4a3f]">Your orders will appear here once you place one.</p>
              <Link to="/products" className="btn-green mt-5">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.orderRef} className="rounded-xl bg-white p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="font-mono text-sm font-semibold text-[#0f3d2e]">{order.orderRef}</p>
                      <p className="text-xs text-brand-secondary mt-0.5">
                        {formatDate(order.createdAt)} · {formatPaymentMethod(order.paymentMethod)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold uppercase tracking-wide rounded-full px-3 py-1 ${STATUS_COLORS[order.status] || 'text-brand-secondary bg-gray-100'}`}>
                        {formatOrderStatus(order.status)}
                      </span>
                      <span className="font-serif text-xl font-bold text-[#0f3d2e]">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <OrderTimeline order={order} />

                  <ul className="space-y-1 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-[#f3ede2]">
                            <ProductImage src={productImageUrl(item.imageFilename)} alt={item.productName} className="h-full w-full object-cover" />
                          </span>
                          <span className="text-brand-primary line-clamp-1">
                            {item.productName}
                            <span className="text-xs text-brand-secondary">
                              {item.size && ` · ${item.size}`}{item.colour && ` · ${item.colour}`}
                            </span>
                          </span>
                        </span>
                        <span className="text-xs text-brand-secondary flex-shrink-0">Qty: {item.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-3 mt-4 border-t border-[#E8E0D3] pt-3">
                    <Link to={`/invoice/${order.orderRef}`} className="btn-green-outline px-4 py-1.5 text-xs">
                      Invoice
                    </Link>
                    {CANCELLABLE.includes(order.status) &&
                      (confirmRef === order.orderRef ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-brand-secondary">Cancel this order?</span>
                          <button
                            onClick={() => handleCancel(order.orderRef)}
                            disabled={cancelling === order.orderRef}
                            className="text-brand-sale font-semibold hover:underline"
                          >
                            {cancelling === order.orderRef ? 'Cancelling…' : 'Yes, cancel'}
                          </button>
                          <button onClick={() => setConfirmRef(null)} className="text-brand-secondary hover:underline">
                            Keep order
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmRef(order.orderRef)}
                          className="text-xs text-brand-sale hover:underline"
                        >
                          Cancel order
                        </button>
                      ))}
                    {order.status === 'DELIVERED' && order.returnEligibleUntil && new Date(order.returnEligibleUntil) > new Date() && returnRef !== order.orderRef && (
                      <button
                        onClick={() => { setReturnRef(order.orderRef); setReturnReason(''); }}
                        className="text-xs text-[#0f5a3f] hover:underline"
                      >
                        Return order
                      </button>
                    )}
                    {order.status === 'DELIVERED' && order.returnEligibleUntil && (
                      <span className="text-xs text-brand-secondary">
                        Returns accepted until {formatDate(order.returnEligibleUntil)}
                      </span>
                    )}
                  </div>

                  {returnRef === order.orderRef && (
                    <div className="mt-3 rounded-lg border border-[#E8E0D3] bg-[#fdf8ee] p-4">
                      <label htmlFor={`return-${order.orderRef}`} className="block text-xs font-semibold text-brand-secondary">
                        Why are you returning this order?
                      </label>
                      <textarea
                        id={`return-${order.orderRef}`}
                        rows={3}
                        maxLength={500}
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="e.g. Wrong size, damaged item, not as described"
                        className="input-cream mt-1.5 w-full text-sm"
                      />
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <button
                          onClick={() => handleReturn(order.orderRef)}
                          disabled={returning === order.orderRef || !returnReason.trim()}
                          className="btn-green px-4 py-1.5 text-xs"
                        >
                          {returning === order.orderRef ? 'Submitting…' : 'Submit return request'}
                        </button>
                        <button onClick={() => setReturnRef(null)} className="text-brand-secondary hover:underline">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {order.status === 'RETURN_REQUESTED' && order.returnReason && (
                    <p className="mt-3 text-xs text-brand-secondary">
                      Return requested{order.returnRequestedAt ? ` on ${formatDate(order.returnRequestedAt)}` : ''}: “{order.returnReason}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
