import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as adminOrderService from '../../services/adminOrderService';
import Pagination from '../../components/ui/Pagination';
import ProductImage from '../../components/ui/ProductImage';
import { productImageUrl } from '../../utils/catalog';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// Mirrors AdminOrderService.TRANSITIONS on the backend, which stays the source of truth.
const NEXT_STATUSES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED'],
  RETURNED: ['REFUND_PENDING'],
  REFUND_PENDING: ['REFUNDED'],
};

const STATUS_FILTERS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED',
  'RETURN_REQUESTED', 'RETURNED', 'REFUND_PENDING', 'REFUNDED'];

const label = (value) => value.replace(/_/g, ' ');

export default function AdminOrders() {
  const { accessToken } = useAuth();
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [busyRef, setBusyRef] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const orders = result.content;
  const rangeInvalid = Boolean(from && to && to < from);

  // Search text is applied shortly after typing stops, and always restarts from the first page.
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!accessToken) { setLoading(false); return; }
      if (rangeInvalid) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const data = await adminOrderService.getAdminOrders({ status: filter, q: query, from, to, page });
        if (!cancelled) setResult(data ?? { content: [], totalElements: 0, totalPages: 0 });
      } catch (err) { if (!cancelled) setError(err?.response?.data?.message || 'Failed to load orders'); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, filter, query, from, to, page, rangeInvalid]);

  const applyUpdate = (updated) => {
    // Under a status filter the order may no longer match; it drops out on the next reload.
    setResult((prev) => ({ ...prev, content: prev.content.map((o) => (o.orderRef === updated.orderRef ? updated : o)) }));
  };

  const changeFilter = (setter) => (e) => { setter(e.target.value); setPage(0); };
  const hasFilters = Boolean(filter || search || from || to);
  const clearFilters = () => { setFilter(''); setSearch(''); setQuery(''); setFrom(''); setTo(''); setPage(0); };

  const run = async (orderRef, action, failure) => {
    setBusyRef(orderRef); setError(null);
    try { applyUpdate(await action()); return true; }
    catch (err) { setError(err?.response?.data?.message || failure); return false; }
    finally { setBusyRef(null); }
  };

  const changeStatus = (order, status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel order ${order.orderRef}? Stock will be restored.`)) return;
    run(order.orderRef, () => adminOrderService.updateAdminOrderStatus(order.orderRef, status), 'Failed to update order status');
  };

  const saveNote = (order) => {
    run(order.orderRef, () => adminOrderService.updateAdminOrderNote(order.orderRef, noteDrafts[order.orderRef] ?? order.internalNote ?? ''), 'Failed to save note')
      .then((saved) => {
        if (saved) setNoteDrafts((prev) => { const { [order.orderRef]: _saved, ...rest } = prev; return rest; });
      });
  };

  const markPaid = (order) => {
    if (!window.confirm(`Mark ${order.orderRef} as paid (${INR.format(order.total)} collected)?`)) return;
    run(order.orderRef, () => adminOrderService.markAdminOrderPaid(order.orderRef), 'Failed to mark order as paid');
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-peacock-gold" />
            <h2 className="font-serif text-2xl font-bold text-peacock-deep">Orders</h2>
          </div>
          <p className="text-sm text-brand-secondary mt-1 ml-3">{result.totalElements} orders{filter ? ` · ${label(filter)}` : ''}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order ref, name or mobile"
          className="input-field w-64 py-2 text-sm"
          aria-label="Search orders"
        />
        <select value={filter} onChange={changeFilter(setFilter)} className="input-field w-auto py-2 text-sm" aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <label className="text-xs text-brand-secondary">
          From
          <input type="date" value={from} max={to || undefined} onChange={changeFilter(setFrom)} className="input-field py-2 text-sm block" />
        </label>
        <label className="text-xs text-brand-secondary">
          To
          <input type="date" value={to} min={from || undefined} onChange={changeFilter(setTo)} className="input-field py-2 text-sm block" />
        </label>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost py-2 px-3 text-xs border border-brand-border">Clear filters</button>
        )}
      </div>
      {rangeInvalid && <p className="mt-2 text-xs text-brand-sale">The "To" date cannot be before the "From" date.</p>}

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="flex-shrink-0">⚠</span><span>{error}</span>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white shadow-card p-4 animate-pulse">
              <div className="skeleton h-4 w-56 mb-2" /><div className="skeleton h-3 w-36" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white shadow-card p-12 text-center text-sm text-brand-secondary">No orders found.</div>
        ) : (
          orders.map((order) => {
            const next = NEXT_STATUSES[order.status] ?? [];
            const canMarkPaid = order.paymentStatus === 'COD_PENDING' && (order.status === 'SHIPPED' || order.status === 'DELIVERED');
            const open = expanded === order.orderRef;
            return (
              <div key={order.orderRef} className="bg-white shadow-card">
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-brand-primary">{order.orderRef}</p>
                    <p className="text-xs text-brand-secondary mt-0.5">
                      {order.shippingAddress?.name} · {order.shippingAddress?.mobile} · {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-peacock-deep">{INR.format(order.total)}</p>
                    <p className="text-xs mt-0.5">
                      <span className="font-semibold uppercase tracking-wide">{label(order.status)}</span>
                      <span className="text-brand-secondary"> · {order.paymentMethod} · {label(order.paymentStatus)}</span>
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {next.map((status) => (
                    <button
                      key={status}
                      disabled={busyRef === order.orderRef}
                      onClick={() => changeStatus(order, status)}
                      className={`btn-ghost py-1.5 px-3 text-xs border ${status === 'CANCELLED' ? 'border-red-200 text-brand-sale hover:bg-red-50' : 'border-brand-border hover:border-peacock-teal'}`}
                    >
                      {status === 'CANCELLED' ? 'Cancel order' : `Mark ${label(status).toLowerCase()}`}
                    </button>
                  ))}
                  {canMarkPaid && (
                    <button disabled={busyRef === order.orderRef} onClick={() => markPaid(order)} className="btn-ghost py-1.5 px-3 text-xs border border-success/30 text-success hover:bg-success/5">
                      Mark COD paid
                    </button>
                  )}
                  <button onClick={() => setExpanded(open ? null : order.orderRef)} className="btn-ghost py-1.5 px-3 text-xs border border-brand-border">
                    {open ? 'Hide details' : 'Details'}
                  </button>
                </div>

                {open && (
                  <div className="mx-5 mb-5 border border-brand-border bg-ivory p-4 text-sm">
                    <p className="text-xs text-brand-secondary mb-3">
                      Ship to: {[order.shippingAddress?.line1, order.shippingAddress?.line2, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(', ')}
                    </p>
                    {order.returnReason && (
                      <p className="text-xs mb-3 border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                        <strong>Customer return reason:</strong> {order.returnReason}
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {order.items.map((item) => (
                        <li key={`${item.sku}-${item.variantId}`} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="h-12 w-10 flex-shrink-0 overflow-hidden border border-brand-border bg-white">
                              <ProductImage src={productImageUrl(item.imageFilename)} alt={item.productName} className="h-full w-full object-cover" />
                            </span>
                            <span>
                              {item.productName}
                              <span className="text-xs text-brand-secondary"> · {item.sku}{item.size ? ` · ${item.size}` : ''}{item.colour ? ` · ${item.colour}` : ''}</span>
                            </span>
                          </span>
                          <span className="whitespace-nowrap">{item.quantity} × {INR.format(item.unitPrice)} = {INR.format(item.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 pt-4 border-t border-brand-border">
                      <label className="block text-xs font-semibold text-brand-secondary" htmlFor={`note-${order.orderRef}`}>
                        Internal note <span className="font-normal">(staff only, never shown to the customer)</span>
                      </label>
                      <textarea
                        id={`note-${order.orderRef}`}
                        rows={2}
                        maxLength={1000}
                        value={noteDrafts[order.orderRef] ?? order.internalNote ?? ''}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [order.orderRef]: e.target.value }))}
                        className="input-field mt-1 w-full text-sm"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          disabled={busyRef === order.orderRef || (noteDrafts[order.orderRef] ?? order.internalNote ?? '') === (order.internalNote ?? '')}
                          onClick={() => saveNote(order)}
                          className="btn-ghost py-1.5 px-3 text-xs border border-brand-border hover:border-peacock-teal disabled:opacity-40"
                        >
                          Save note
                        </button>
                        <Link
                          to={`/admin/orders/${order.orderRef}/slip`}
                          target="_blank"
                          rel="noopener"
                          className="btn-ghost py-1.5 px-3 text-xs border border-brand-border hover:border-peacock-teal"
                        >
                          Packing slip
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Pagination page={page} totalPages={result.totalPages} totalElements={result.totalElements} onChange={setPage} disabled={loading} />
    </div>
  );
}
