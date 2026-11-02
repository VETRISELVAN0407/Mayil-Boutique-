import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as adminOrderService from '../../services/adminOrderService';
import { STORE_INFO } from '../../config/store';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/**
 * Printable packing slip for the parcel. Deliberately shows no item prices and never the internal note,
 * so it can go in the box; the only amount is cash to collect on delivery.
 */
export default function AdminPackingSlip() {
  const { orderRef } = useParams();
  const { accessToken } = useAuth();
  const [state, setState] = useState({ loading: true, order: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!accessToken) return;
      try {
        const order = await adminOrderService.getAdminOrder(orderRef);
        if (!cancelled) setState({ loading: false, order, error: null });
      } catch (err) {
        if (!cancelled) setState({ loading: false, order: null, error: err?.response?.data?.message || 'Failed to load order' });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, orderRef]);

  const { loading, order, error } = state;
  if (loading) return <p className="text-sm text-brand-secondary">Loading…</p>;
  if (error) return <p className="text-sm text-brand-sale">{error}</p>;

  const address = order.shippingAddress ?? {};
  const collect = order.paymentMethod === 'COD' && order.paymentStatus === 'COD_PENDING';
  const unitCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="btn-primary py-2 px-4 text-sm">Print</button>
        <Link to="/admin/orders" className="btn-ghost py-2 px-4 text-sm border border-brand-border">Back to orders</Link>
      </div>

      <div className="bg-white shadow-card p-8 print:shadow-none print:p-0 text-sm text-black">
        <div className="flex justify-between items-start gap-4 border-b border-black pb-4">
          <div>
            <p className="font-serif text-xl font-bold">{STORE_INFO.name}</p>
            <p className="text-xs">{STORE_INFO.address}</p>
            <p className="text-xs">{STORE_INFO.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest">Packing slip</p>
            <p className="font-mono font-semibold">{order.orderRef}</p>
            <p className="text-xs">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest">Ship to</p>
          <p className="font-semibold">{address.name}</p>
          <p>{[address.line1, address.line2].filter(Boolean).join(', ')}</p>
          <p>{[address.city, address.state, address.pincode].filter(Boolean).join(', ')}</p>
          <p>Mobile: {address.mobile}</p>
        </div>

        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="border-b border-black text-left text-xs uppercase tracking-wide">
              <th className="py-1.5 pr-2">Item</th>
              <th className="py-1.5 pr-2">SKU</th>
              <th className="py-1.5 pr-2">Size</th>
              <th className="py-1.5 pr-2">Colour</th>
              <th className="py-1.5 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.sku}-${item.variantId}`} className="border-b border-gray-300">
                <td className="py-1.5 pr-2">{item.productName}</td>
                <td className="py-1.5 pr-2 font-mono text-xs">{item.sku}</td>
                <td className="py-1.5 pr-2">{item.size ?? '—'}</td>
                <td className="py-1.5 pr-2">{item.colour ?? '—'}</td>
                <td className="py-1.5 text-right font-semibold">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-2 text-right text-xs uppercase tracking-wide">Total units</td>
              <td className="pt-2 text-right font-semibold">{unitCount}</td>
            </tr>
          </tfoot>
        </table>

        {collect && (
          <p className="mt-6 border border-black p-3 text-center font-semibold">
            Cash on delivery — collect {INR.format(order.total)}
          </p>
        )}
      </div>
    </div>
  );
}
