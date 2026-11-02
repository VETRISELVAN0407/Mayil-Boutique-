import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const ORDER_STATUS_STYLES = {
  PENDING:   'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  SHIPPED:   'bg-peacock-teal/10 text-peacock-teal',
  DELIVERED: 'bg-success/10 text-success',
  CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED:  'bg-orange-50 text-orange-700',
};

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!accessToken) { setLoading(false); return; }

    setLoading(true);
    setError(null);
    authService
      .getDashboardSummary()
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.message || 'Failed to load dashboard'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [accessToken]);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white shadow-card p-5 animate-pulse">
              <div className="skeleton h-3 w-16 mb-3" />
              <div className="skeleton h-7 w-24 mb-2" />
              <div className="skeleton h-2.5 w-12" />
            </div>
          ))}
        </div>
        <div className="mt-6 bg-white shadow-card p-5 animate-pulse">
          <div className="skeleton h-4 w-32 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader />
        <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700">
          <span className="flex-shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Gross Sales',
      value: INR.format(Number(summary?.sales ?? 0)),
      icon: SalesIcon,
      accent: 'text-peacock-teal',
      bg: 'bg-peacock-teal/5',
      note: 'Excl. cancelled & refunded',
    },
    {
      label: 'Total Orders',
      value: summary?.orders ?? 0,
      icon: OrdersIcon,
      accent: 'text-peacock-blue',
      bg: 'bg-peacock-blue/5',
      note: 'All time',
    },
    {
      label: 'Customers',
      value: summary?.customers ?? 0,
      icon: CustomersIcon,
      accent: 'text-peacock-emerald',
      bg: 'bg-peacock-emerald/5',
      note: 'Registered',
    },
    {
      label: 'Products',
      value: summary?.products ?? 0,
      icon: ProductsIcon,
      accent: 'text-gold-500',
      bg: 'bg-gold-500/5',
      note: 'In catalogue',
    },
    {
      label: 'Low Stock',
      value: summary?.lowStock ?? 0,
      icon: AlertIcon,
      accent: summary?.lowStock > 0 ? 'text-brand-sale' : 'text-success',
      bg: summary?.lowStock > 0 ? 'bg-brand-sale/5' : 'bg-success/5',
      note: 'Variants with 5 or fewer units',
      to: '/admin/stock-update',
    },
  ];

  return (
    <div>
      <PageHeader />

      {/* Metric cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((m) => {
          const Card = m.to ? Link : 'div';
          return (
          <Card key={m.label} {...(m.to ? { to: m.to } : {})} className="bg-white shadow-card p-5 group hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">{m.label}</p>
              <div className={`${m.bg} ${m.accent} p-2 rounded-sm`}>
                <m.icon size={14} />
              </div>
            </div>
            <p className={`font-serif text-2xl font-bold ${m.accent}`}>{m.value}</p>
            <p className="text-[10px] text-brand-secondary mt-1">{m.note}</p>
          </Card>
          );
        })}
      </div>

      {/* Recent orders table */}
      <div className="mt-6 bg-white shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
          <h3 className="font-serif text-base font-semibold text-peacock-deep">Recent Orders</h3>
          <span className="text-xs text-brand-secondary">Last 10</span>
        </div>
        {!summary?.recentOrders?.length ? (
          <div className="py-12 text-center text-sm text-brand-secondary">
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-ivory">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Customer</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Total</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {summary.recentOrders.map((order) => (
                  <tr key={order.orderRef} className="hover:bg-ivory transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-peacock-deep font-semibold">
                      {order.orderRef}
                    </td>
                    <td className="px-5 py-3 text-brand-primary">{order.customerName}</td>
                    <td className="px-5 py-3 text-right font-semibold text-peacock-deep">
                      {INR.format(Number(order.total ?? 0))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-brand-secondary'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-medium ${order.paymentStatus === 'PAID' ? 'text-success' : 'text-brand-secondary'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-5 bg-peacock-gold" />
        <h2 className="font-serif text-2xl font-bold text-peacock-deep">Dashboard</h2>
      </div>
      <p className="text-sm text-brand-secondary ml-3">Store overview and recent activity</p>
    </div>
  );
}

function SalesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function OrdersIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function CustomersIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ProductsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function AlertIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
