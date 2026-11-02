import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as promotionService from '../../services/adminPromotionService';
import { getProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import Modal from '../../components/ui/Modal';

const EMPTY_FORM = { name: '', percentOff: '', scope: 'ALL', categoryId: '', productIds: [], startsAt: '', endsAt: '' };
const STATE_STYLES = {
  RUNNING: 'bg-green-50 text-green-700',
  SCHEDULED: 'bg-amber-50 text-amber-800',
  ENDED: 'bg-gray-100 text-gray-600',
  PAUSED: 'bg-gray-100 text-gray-600',
};

const formatWhen = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminSales() {
  const { accessToken } = useAuth();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [productSearch, setProductSearch] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);
  const productName = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.name])), [products]);

  const load = useCallback(async () => {
    try {
      setSales(await promotionService.getSales());
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    load();
    getProducts().then((d) => setProducts(Array.isArray(d) ? d : d.content || [])).catch(() => {});
    getCategories().then((d) => setCategories(Array.isArray(d) ? d : d.content || [])).catch(() => {});
  }, [accessToken, load]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setProductSearch(''); setFormError(null); setFormOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, percentOff: s.percentOff,
      scope: s.allProducts ? 'ALL' : s.categoryId ? 'CATEGORY' : 'PRODUCTS',
      categoryId: s.categoryId ?? '', productIds: s.productIds,
      startsAt: toLocalInput(s.startsAt), endsAt: toLocalInput(s.endsAt),
    });
    setProductSearch(''); setFormError(null); setFormOpen(true);
  };
  const closeForm = useCallback(() => setFormOpen(false), []);

  const toggleProduct = (id) => setForm((f) => ({
    ...f, productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id],
  }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.scope === 'CATEGORY' && !form.categoryId) { setFormError('Choose a category.'); return; }
    if (form.scope === 'PRODUCTS' && form.productIds.length === 0) { setFormError('Choose at least one product.'); return; }
    setSubmitting(true); setFormError(null);
    const payload = {
      name: form.name.trim(),
      percentOff: Number(form.percentOff),
      allProducts: form.scope === 'ALL',
      categoryId: form.scope === 'CATEGORY' ? Number(form.categoryId) : null,
      productIds: form.scope === 'PRODUCTS' ? form.productIds : [],
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };
    try {
      if (editing) await promotionService.updateSale(editing.id, payload);
      else await promotionService.createSale(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save sale');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (s) => {
    try { await promotionService.setSaleActive(s.id, !s.active); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to update sale'); }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete sale "${s.name}"? Prices go back to normal immediately.`)) return;
    try { await promotionService.deleteSale(s.id); await load(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to delete sale'); }
  };

  const appliesTo = (s) => {
    if (s.allProducts) return 'All products';
    const parts = [];
    if (s.categoryId) parts.push(`Category: ${categoryName[s.categoryId] ?? s.categoryId}`);
    if (s.productIds.length) {
      const names = s.productIds.map((id) => productName[id] ?? `#${id}`);
      parts.push(`${names.slice(0, 3).join(', ')}${names.length > 3 ? ` +${names.length - 3} more` : ''}`);
    }
    return parts.join(' · ');
  };

  const visibleProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.trim().toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-peacock-gold" />
            <h2 className="font-serif text-2xl font-bold text-peacock-deep">Discounts &amp; Sales</h2>
          </div>
          <p className="text-sm text-brand-secondary mt-1 ml-3">
            Scheduled percentage-off sales. Prices change automatically while a sale runs. If a product also has its own sale price, the lower price is used.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary py-2.5 px-5">Add sale</button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">⚠ {error}</div>
      )}

      <div className="mt-6 bg-white shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-brand-secondary border-b border-brand-border">
              <th className="px-4 py-3">Sale</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Applies to</th>
              <th className="px-4 py-3">Runs</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-brand-secondary">Loading sales…</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-brand-secondary">No sales yet.</td></tr>
            ) : sales.map((s) => (
              <tr key={s.id} className="border-b border-brand-border last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-brand-primary">{s.name}</td>
                <td className="px-4 py-3">{Number(s.percentOff)}% off</td>
                <td className="px-4 py-3 text-xs text-brand-secondary">{appliesTo(s)}</td>
                <td className="px-4 py-3 text-xs text-brand-secondary whitespace-nowrap">
                  <p>{formatWhen(s.startsAt)}</p>
                  <p>to {formatWhen(s.endsAt)}</p>
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold ${STATE_STYLES[s.state]}`}>{s.state[0] + s.state.slice(1).toLowerCase()}</span></td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                  <button onClick={() => openEdit(s)} className="text-peacock-teal hover:underline">Edit</button>
                  <button onClick={() => toggle(s)} className="text-brand-secondary hover:underline">{s.active ? 'Pause' : 'Resume'}</button>
                  <button onClick={() => remove(s)} className="text-brand-sale hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <Modal title={editing ? `Edit sale: ${editing.name}` : 'Add sale'} onClose={closeForm} maxWidth="max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">⚠ {formError}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Sale name
                <input value={form.name} onChange={set('name')} required maxLength={100} placeholder="Diwali Sale" className="input-field mt-1.5 w-full text-sm" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Percentage off (1–90)
                <input type="number" min="1" max="90" step="0.01" required value={form.percentOff} onChange={set('percentOff')} className="input-field mt-1.5 w-full text-sm" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Starts
                <input type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} className="input-field mt-1.5 w-full text-sm" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
                Ends
                <input type="datetime-local" required value={form.endsAt} onChange={set('endsAt')} className="input-field mt-1.5 w-full text-sm" />
              </label>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-widest text-brand-secondary">Applies to</legend>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {[['ALL', 'All products'], ['CATEGORY', 'A category'], ['PRODUCTS', 'Chosen products']].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input type="radio" name="scope" value={value} checked={form.scope === value} onChange={set('scope')} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            {form.scope === 'CATEGORY' && (
              <select value={form.categoryId} onChange={set('categoryId')} className="input-field w-full text-sm" aria-label="Category">
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {form.scope === 'PRODUCTS' && (
              <div>
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products…" className="input-field w-full text-sm" aria-label="Search products" />
                <div className="mt-2 max-h-52 overflow-y-auto border border-brand-border divide-y divide-brand-border">
                  {visibleProducts.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-brand-secondary">No products found.</p>
                  ) : visibleProducts.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-ivory">
                      <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                      {p.name}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-brand-secondary">{form.productIds.length} selected</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeForm} className="btn-outline px-5 py-2.5">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary px-5 py-2.5 disabled:opacity-50">
                {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create sale'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
