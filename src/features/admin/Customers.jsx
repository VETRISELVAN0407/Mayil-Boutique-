import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminCustomerService from '../../services/adminCustomerService';
import Pagination from '../../components/ui/Pagination';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const label = (value) => value.replace(/_/g, ' ');
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '—');

export default function AdminCustomers() {
  const { accessToken } = useAuth();
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState({ id: null, loading: false, orders: [], error: null });

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!accessToken) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const data = await adminCustomerService.getAdminCustomers({ q: query, page });
        if (!cancelled) setResult(data ?? { content: [], totalElements: 0, totalPages: 0 });
      } catch (err) { if (!cancelled) setError(err?.response?.data?.message || 'Failed to load customers'); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, query, page]);

  const toggle = async (customer) => {
    if (expanded === customer.id) { setExpanded(null); return; }
    setExpanded(customer.id);
    setDetail({ id: customer.id, loading: true, orders: [], error: null });
    try {
      const data = await adminCustomerService.getAdminCustomer(customer.id);
      setDetail((prev) => (prev.id === customer.id ? { id: customer.id, loading: false, orders: data.orders ?? [], error: null } : prev));
    } catch (err) {
      setDetail((prev) => (prev.id === customer.id
        ? { id: customer.id, loading: false, orders: [], error: err?.response?.data?.message || 'Failed to load orders' }
        : prev));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-peacock-gold" />
        <h2 className="font-serif text-2xl font-bold text-peacock-deep">Customers</h2>
      </div>
      <p className="text-sm text-brand-secondary mt-1 ml-3">{result.totalElements} customers</p>

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by mobile number"
          className="input-field w-64 py-2 text-sm"
          aria-label="Search customers"
        />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="flex-shrink-0">⚠</span><span>{error}</span>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white shadow-card p-4 animate-pulse">
              <div className="skeleton h-4 w-40 mb-2" /><div className="skeleton h-3 w-56" />
            </div>
          ))
        ) : result.content.length === 0 ? (
          <div className="bg-white shadow-card p-12 text-center text-sm text-brand-secondary">No customers found.</div>
        ) : (
          result.content.map((customer) => {
            const open = expanded === customer.id;
            return (
              <div key={customer.id} className="bg-white shadow-card">
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-brand-primary">{customer.mobile}</p>
                    <p className="text-xs text-brand-secondary mt-0.5">
                      Joined {formatDate(customer.joinedAt)} · Last order {formatDate(customer.lastOrderAt)}
                      {customer.status !== 'ACTIVE' ? ` · ${label(customer.status)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-peacock-deep">{INR.format(customer.totalSpent)}</p>
                    <p className="text-xs text-brand-secondary mt-0.5">{customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}</p>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <button onClick={() => toggle(customer)} className="btn-ghost py-1.5 px-3 text-xs border border-brand-border">
                    {open ? 'Hide orders' : 'View orders'}
                  </button>
                </div>
                {open && (
                  <div className="mx-5 mb-5 border border-brand-border bg-ivory p-4 text-sm">
                    {detail.loading ? (
                      <p className="text-xs text-brand-secondary">Loading…</p>
                    ) : detail.error ? (
                      <p className="text-xs text-brand-sale">{detail.error}</p>
                    ) : detail.orders.length === 0 ? (
                      <p className="text-xs text-brand-secondary">No orders yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {detail.orders.map((order) => (
                          <li key={order.orderRef} className="flex flex-wrap justify-between gap-3">
                            <span>
                              <span className="font-mono font-semibold">{order.orderRef}</span>
                              <span className="text-xs text-brand-secondary"> · {formatDate(order.createdAt)}</span>
                            </span>
                            <span className="text-xs">
                              <span className="font-semibold uppercase tracking-wide">{label(order.status)}</span>
                              <span className="text-brand-secondary"> · {INR.format(order.total)}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
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
