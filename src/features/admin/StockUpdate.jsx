import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminStockService from '../../services/adminStockService';
import { getProducts, getProductVariants } from '../../services/productService';
import Pagination from '../../components/ui/Pagination';

const EMPTY_HISTORY = { content: [], totalElements: 0, totalPages: 0 };
const MAX_QUANTITY = 100000;
const LOW_STOCK_THRESHOLD = 5; // same rule as the dashboard "Low Stock" card

const variantLabel = (v) => [v.size && `${v.size}${v.sizeNumber ? ` (${v.sizeNumber})` : ''}`, v.colour].filter(Boolean).join(' / ') || v.sku;
const formatDate = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminStockUpdate() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [history, setHistory] = useState(EMPTY_HISTORY);
  const [historyPage, setHistoryPage] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [lowStock, setLowStock] = useState(EMPTY_HISTORY);
  const [lowPage, setLowPage] = useState(0);
  const [loadingLow, setLoadingLow] = useState(true);
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const selectedVariant = variants.find((v) => String(v.id) === String(variantId));

  useEffect(() => {
    if (!accessToken) return;
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : data.content || []))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load products'))
      .finally(() => setLoadingProducts(false));
  }, [accessToken]);

  const loadVariants = useCallback(async (id) => {
    setLoadingVariants(true);
    try {
      setVariants(await getProductVariants(id));
    } catch (err) {
      setVariants([]);
      setError(err?.response?.data?.message || 'Failed to load variants');
    } finally {
      setLoadingVariants(false);
    }
  }, []);

  const loadHistory = useCallback(async (page) => {
    setLoadingHistory(true);
    try {
      setHistory(await adminStockService.getStockHistory({ page }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load stock history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) loadHistory(historyPage);
  }, [accessToken, historyPage, loadHistory]);

  const loadLowStock = useCallback(async (page) => {
    setLoadingLow(true);
    try {
      setLowStock(await adminStockService.getLowStock({ threshold: LOW_STOCK_THRESHOLD, page }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load low stock');
    } finally {
      setLoadingLow(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) loadLowStock(lowPage);
  }, [accessToken, lowPage, loadLowStock]);

  /** "Add stock" on a low-stock row: preselect its product and variant in the form and jump to it. */
  const pickLowStock = async (row) => {
    setProductId(String(row.productId)); setVariantId(String(row.variantId)); setQuantity('');
    setError(null); setSuccess(null);
    await loadVariants(row.productId);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onProductChange = (e) => {
    const id = e.target.value;
    setProductId(id); setVariantId(''); setVariants([]); setQuantity('');
    setError(null); setSuccess(null);
    if (id) loadVariants(id);
  };

  const onVariantChange = (e) => {
    setVariantId(e.target.value); setQuantity(''); setError(null); setSuccess(null);
  };

  const qty = Number(quantity);
  const qtyValid = quantity !== '' && Number.isInteger(qty) && qty >= 1 && qty <= MAX_QUANTITY;
  const newTotal = selectedVariant && qtyValid ? selectedVariant.stockQuantity + qty : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!productId || !variantId) { setError('Select a product and a variant.'); return; }
    if (!qtyValid) { setError(`Adding stock must be a whole number from 1 to ${MAX_QUANTITY}.`); return; }
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const result = await adminStockService.addStock({ productId: Number(productId), variantId: Number(variantId), quantity: qty });
      setSuccess(`Added ${result.stockAdded} to ${result.productName} (${variantLabel(result)}). New total stock: ${result.totalStock}.`);
      setQuantity('');
      await loadVariants(productId); // refresh the existing stock shown above
      loadLowStock(lowPage);
      if (historyPage === 0) await loadHistory(0); else setHistoryPage(0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-peacock-gold" />
        <h2 className="font-serif text-2xl font-bold text-peacock-deep">Stock Update</h2>
      </div>
      <p className="text-sm text-brand-secondary mt-1 ml-3">Add received stock to a product variant. The quantity is added to the existing stock.</p>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          <span className="flex-shrink-0">⚠</span><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-4 flex items-start gap-2 bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800" role="status">
          <span className="flex-shrink-0">✓</span><span>{success}</span>
        </div>
      )}

      <h3 className="mt-6 font-serif text-lg font-bold text-peacock-deep">Low Stock ({LOW_STOCK_THRESHOLD} or fewer units)</h3>
      <div className="mt-3 bg-white shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-brand-secondary border-b border-brand-border">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3 text-right">In Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loadingLow ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-brand-secondary">Loading low stock…</td></tr>
            ) : lowStock.content.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-brand-secondary">Nothing is running low.</td></tr>
            ) : (
              lowStock.content.map((row) => (
                <tr key={row.variantId} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-primary">{row.productName}</td>
                  <td className="px-4 py-3 text-brand-secondary">{variantLabel(row)} <span className="font-mono text-xs">({row.sku})</span></td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.stockQuantity === 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {row.stockQuantity === 0 ? 'Out of stock' : row.stockQuantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => pickLowStock(row)} disabled={submitting} className="text-sm font-semibold text-peacock-deep hover:underline disabled:opacity-50">Add stock</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={lowPage} totalPages={lowStock.totalPages} totalElements={lowStock.totalElements} onChange={setLowPage} disabled={loadingLow} />

      <form ref={formRef} onSubmit={submit} className="mt-6 bg-white shadow-card p-5 md:p-6 space-y-5 max-w-3xl scroll-mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
            Product
            <select value={productId} onChange={onProductChange} disabled={loadingProducts || submitting} className="input-field mt-1.5 w-full normal-case tracking-normal font-normal text-sm">
              <option value="">{loadingProducts ? 'Loading products…' : 'Select a product'}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
            Variant
            <select value={variantId} onChange={onVariantChange} disabled={!productId || loadingVariants || submitting} className="input-field mt-1.5 w-full normal-case tracking-normal font-normal text-sm">
              <option value="">{!productId ? 'Select a product first' : loadingVariants ? 'Loading variants…' : variants.length === 0 ? 'No variants for this product' : 'Select a variant'}</option>
              {variants.map((v) => <option key={v.id} value={v.id}>{variantLabel(v)} ({v.sku})</option>)}
            </select>
          </label>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary max-w-xs">
          Existing Stock
          <input type="text" readOnly value={selectedVariant ? selectedVariant.stockQuantity : ''} placeholder="—" className="input-field mt-1.5 w-full bg-gray-50 normal-case tracking-normal font-normal text-sm" />
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary">
            Adding Stock
            <input
              type="number"
              min="1"
              max={MAX_QUANTITY}
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setSuccess(null); }}
              disabled={!selectedVariant || submitting}
              className="input-field mt-1.5 w-40 normal-case tracking-normal font-normal text-sm"
            />
          </label>
          <button type="submit" disabled={!selectedVariant || !qtyValid || submitting} className="btn-primary py-2.5 px-5 disabled:opacity-50">
            {submitting ? 'Adding…' : 'Add Stock'}
          </button>
          {newTotal !== null && <span className="text-sm text-brand-secondary pb-2.5">New total will be <strong className="text-brand-primary">{newTotal}</strong></span>}
        </div>
      </form>

      <h3 className="mt-10 font-serif text-lg font-bold text-peacock-deep">Stock Update History</h3>
      <div className="mt-3 bg-white shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-brand-secondary border-b border-brand-border">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3 text-right">Stock Added</th>
              <th className="px-4 py-3 text-right">Total Stock</th>
              <th className="px-4 py-3">Updated On</th>
            </tr>
          </thead>
          <tbody>
            {loadingHistory ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-brand-secondary">Loading history…</td></tr>
            ) : history.content.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-brand-secondary">No stock updates yet.</td></tr>
            ) : (
              history.content.map((row) => (
                <tr key={row.id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-primary">{row.productName}</td>
                  <td className="px-4 py-3 text-brand-secondary">{variantLabel(row)} <span className="font-mono text-xs">({row.sku})</span></td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">+{row.stockAdded}</td>
                  <td className="px-4 py-3 text-right">{row.totalStock}</td>
                  <td className="px-4 py-3 text-brand-secondary whitespace-nowrap">{formatDate(row.updatedOn)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={historyPage} totalPages={history.totalPages} totalElements={history.totalElements} onChange={setHistoryPage} disabled={loadingHistory} />
    </div>
  );
}
