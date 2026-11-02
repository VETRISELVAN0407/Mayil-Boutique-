import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as promotionService from '../../services/adminPromotionService';
import Modal from '../../components/ui/Modal';

const TYPE_LABELS = { PERCENT: 'Percentage off', FLAT: 'Flat amount off', FREE_SHIPPING: 'Free shipping' };
const EMPTY_FORM = {
  code: '', description: '', type: 'PERCENT', value: '', maxDiscount: '', minOrderValue: '',
  startsAt: '', endsAt: '', usageLimit: '', oncePerCustomer: false,
};

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const formatWhen = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

// <input type="datetime-local"> works in local time; the API wants an instant.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toInstant = (local) => (local ? new Date(local).toISOString() : null);

function describe(c) {
  if (c.type === 'PERCENT') return `${Number(c.value)}% off${c.maxDiscount ? ` (max ${INR.format(c.maxDiscount)})` : ''}`;
  if (c.type === 'FLAT') return `${INR.format(c.value)} off`;
  return 'Free shipping';
}

function status(c) {
  const now = Date.now();
  if (!c.active) return { label: 'Inactive', cls: 'bg-gray-100 text-gray-600' };
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return { label: 'Expired', cls: 'bg-red-50 text-red-700' };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: 'Scheduled', cls: 'bg-amber-50 text-amber-800' };
  if (c.usageLimit && c.usedCount >= c.usageLimit) return { label: 'Used up', cls: 'bg-red-50 text-red-700' };
  return { label: 'Active', cls: 'bg-green-50 text-green-700' };
}

export default function AdminCoupons() {
  const { accessToken } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setCoupons(await promotionService.getCoupons());
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (accessToken) load(); }, [accessToken, load]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setFormOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description ?? '', type: c.type, value: c.value ?? '', maxDiscount: c.maxDiscount ?? '',
      minOrderValue: c.minOrderValue ? c.minOrderValue : '', startsAt: toLocalInput(c.startsAt), endsAt: toLocalInput(c.endsAt),
      usageLimit: c.usageLimit ?? '', oncePerCustomer: c.oncePerCustomer,
    });
    setFormError(null);
    setFormOpen(true);
  };
  const closeForm = useCallback(() => setFormOpen(false), []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError(null);
    const num = (v) => (v === '' || v == null ? null : Number(v));
    const payload = {
      code: form.code.trim(),
      description: form.description.trim() || null,
      type: form.type,
      value: form.type === 'FREE_SHIPPING' ? 0 : num(form.value),
      maxDiscount: form.type === 'PERCENT' ? num(form.maxDiscount) : null,
      minOrderValue: num(form.minOrderValue) ?? 0,
      startsAt: toInstant(form.startsAt),
      endsAt: toInstant(form.endsAt),
      usageLimit: num(form.usageLimit),
      oncePerCustomer: form.oncePerCustomer,
    };
    try {
      if (editing) await promotionService.updateCoupon(editing.id, payload);
      else await promotionService.createCoupon(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (c) => {
    try { await promotionService.setCouponActive(c.id, !c.active); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to update coupon'); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try { await promotionService.deleteCoupon(c.id); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to delete coupon'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-peacock-gold" />
            <h2 className="font-serif text-2xl font-bold text-peacock-deep">Coupons</h2>
          </div>
          <p className="text-sm text-brand-secondary mt-1 ml-3">Codes customers enter at checkout.</p>
        </div>
        <button onClick={openCreate} className="btn-primary py-2.5 px-5">Add coupon</button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">⚠ {error}</div>
      )}

      <div className="mt-6 bg-white shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-brand-secondary border-b border-brand-border">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Rules</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-brand-secondary">Loading coupons…</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-brand-secondary">No coupons yet.</td></tr>
            ) : coupons.map((c) => {
              const st = status(c);
              return (
                <tr key={c.id} className="border-b border-brand-border last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-brand-primary">{c.code}</p>
                    {c.description && <p className="text-xs text-brand-secondary mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">{describe(c)}</td>
                  <td className="px-4 py-3 text-xs text-brand-secondary space-y-0.5">
                    {Number(c.minOrderValue) > 0 && <p>Min order {INR.format(c.minOrderValue)}</p>}
                    {c.startsAt && <p>From {formatWhen(c.startsAt)}</p>}
                    {c.endsAt && <p>Until {formatWhen(c.endsAt)}</p>}
                    {c.oncePerCustomer && <p>Once per customer</p>}
                  </td>
                  <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                    <button onClick={() => openEdit(c)} className="text-peacock-teal hover:underline">Edit</button>
                    <button onClick={() => toggle(c)} className="text-brand-secondary hover:underline">{c.active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => remove(c)} className="text-brand-sale hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <Modal title={editing ? `Edit coupon ${editing.code}` : 'Add coupon'} onClose={closeForm} maxWidth="max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">⚠ {formError}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Code
                <input value={form.code} onChange={set('code')} disabled={!!editing} required minLength={3} maxLength={32}
                  className="input-field mt-1.5 w-full uppercase font-mono text-sm" placeholder="DIWALI10" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Type
                <select value={form.type} onChange={set('type')} className="input-field mt-1.5 w-full text-sm">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              {form.type !== 'FREE_SHIPPING' && (
                <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                  {form.type === 'PERCENT' ? 'Percentage (1–100)' : 'Amount (₹)'}
                  <input type="number" min="0.01" max={form.type === 'PERCENT' ? 100 : undefined} step="0.01" required
                    value={form.value} onChange={set('value')} className="input-field mt-1.5 w-full text-sm" />
                </label>
              )}
              {form.type === 'PERCENT' && (
                <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                  Maximum discount (₹, optional)
                  <input type="number" min="0.01" step="0.01" value={form.maxDiscount} onChange={set('maxDiscount')} className="input-field mt-1.5 w-full text-sm" />
                </label>
              )}
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Minimum order value (₹)
                <input type="number" min="0" step="0.01" value={form.minOrderValue} onChange={set('minOrderValue')} className="input-field mt-1.5 w-full text-sm" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Total usage limit (blank = unlimited)
                <input type="number" min="1" step="1" value={form.usageLimit} onChange={set('usageLimit')} className="input-field mt-1.5 w-full text-sm" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Starts (optional)
                <input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} className="input-field mt-1.5 w-full text-sm" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Ends (optional)
                <input type="datetime-local" value={form.endsAt} onChange={set('endsAt')} className="input-field mt-1.5 w-full text-sm" />
              </label>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
              Description (optional)
              <input value={form.description} onChange={set('description')} maxLength={255} className="input-field mt-1.5 w-full text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-primary">
              <input type="checkbox" checked={form.oncePerCustomer} onChange={set('oncePerCustomer')} />
              Each customer can use this coupon only once
            </label>
            {form.type === 'FREE_SHIPPING' && (
              <p className="text-xs text-brand-secondary">Shipping is currently free for every order, so this coupon has no effect until shipping charges are introduced.</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeForm} className="btn-outline px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5 disabled:opacity-50">
                {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
