import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as categoryService from '../../services/categoryService';
import * as productService from '../../services/productService';
import { productImageUrl } from '../../utils/catalog';
import ProductImage from '../../components/ui/ProductImage';
import ProductImageManager from './ProductImageManager';
import TryOnSettings from './TryOnSettings';
import Modal from '../../components/ui/Modal';

const EMPTY_FORM = { name: '', slug: '', description: '', categoryId: '', price: '', salePrice: '', sku: '' };
const EMPTY_VARIANT_FORM = { sku: '', size: '', sizeNumber: '', colour: '', stockQuantity: '' };

const STATUS_STYLES = {
  DRAFT:     'bg-gray-100 text-brand-secondary',
  PUBLISHED: 'bg-success/10 text-success',
  ARCHIVED:  'bg-orange-50 text-orange-700',
};

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function AdminProducts() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [stagedImages, setStagedImages] = useState([]);
  const [variantPanelOpen, setVariantPanelOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [variantFormError, setVariantFormError] = useState(null);
  const [submittingVariant, setSubmittingVariant] = useState(false);
  const [stockDrafts, setStockDrafts] = useState({});
  const [search, setSearch] = useState('');

  const loadProducts = async () => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [productData, categoryData] = await Promise.all([productService.getProducts(), categoryService.getCategories()]);
      setProducts(productData ?? []); setCategories(categoryData ?? []);
    } catch (err) { setError(err?.response?.data?.message || 'Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!accessToken) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const [productData, categoryData] = await Promise.all([productService.getProducts(), categoryService.getCategories()]);
        if (!cancelled) { setProducts(productData ?? []); setCategories(categoryData ?? []); }
      } catch (err) { if (!cancelled) setError(err?.response?.data?.message || 'Failed to load products'); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken]);

  const loadVariants = async (productId) => {
    try { const data = await productService.getProductVariants(productId); setProductVariants(data ?? []); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to load variants'); }
  };

  const openVariantPanel = async (product) => {
    setVariantProduct(product); setVariantForm(EMPTY_VARIANT_FORM); setVariantFormError(null);
    setProductVariants([]); setVariantPanelOpen(true); await loadVariants(product.id);
  };
  const closeVariantPanel = () => { setVariantPanelOpen(false); setVariantProduct(null); setProductVariants([]); loadProducts(); }; // refresh the stock totals

  // Image changes on an existing product are saved straight away, so keep the form and the list in step with them.
  const handleProductChange = (updated) => {
    setEditingProduct(updated);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const openCreateForm = () => { setEditingProduct(null); setForm(EMPTY_FORM); setStagedImages([]); setFormError(null); setFormOpen(true); };
  const openEditForm = (p) => {
    setEditingProduct(p);
    setForm({ name: p.name ?? '', slug: p.slug ?? '', description: p.description ?? '', categoryId: p.categoryId ?? '', price: p.price != null ? String(p.price) : '', salePrice: p.salePrice != null ? String(p.salePrice) : '', sku: p.sku ?? '' });
    setStagedImages([]); setFormError(null); setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditingProduct(null); setForm(EMPTY_FORM); setStagedImages([]); setFormError(null); };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim() || !form.price.trim() || !form.sku.trim()) { setFormError('Name, slug, price and SKU are required'); return; }
    const price = Number(form.price);
    if (Number.isNaN(price) || price <= 0) { setFormError('Price must be greater than zero'); return; }
    const salePrice = form.salePrice ? Number(form.salePrice) : null;
    if (salePrice !== null && (Number.isNaN(salePrice) || salePrice < 0)) { setFormError('Sale price must be ≥ 0'); return; }
    if (salePrice !== null && salePrice > price) { setFormError('Sale price cannot exceed the regular price'); return; }
    setSubmitting(true); setFormError(null);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim(), description: form.description?.trim() || '', categoryId: form.categoryId ? Number(form.categoryId) : null, price, salePrice, sku: form.sku.trim() };
      if (editingProduct) await productService.updateProduct(editingProduct.id, payload);
      else await productService.createProduct(payload, stagedImages);
      closeForm(); await loadProducts();
    } catch (err) { setFormError(err?.response?.data?.message || 'Failed to save product'); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (product, status) => {
    try { await productService.updateProductStatus(product.id, status); await loadProducts(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to update product status'); }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try { await productService.deleteProduct(product.id); await loadProducts(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to delete product'); }
  };

  const handleVariantFormSubmit = async (e) => {
    e.preventDefault();
    if (!variantProduct) return;
    if (!variantForm.sku.trim()) { setVariantFormError('Variant SKU is required'); return; }
    const stockQuantity = Number(variantForm.stockQuantity);
    if (Number.isNaN(stockQuantity) || stockQuantity < 0) { setVariantFormError('Stock cannot be negative'); return; }
    setSubmittingVariant(true); setVariantFormError(null);
    try {
      await productService.createProductVariant(variantProduct.id, { sku: variantForm.sku.trim(), size: variantForm.size?.trim() || null, sizeNumber: variantForm.sizeNumber?.trim() || null, colour: variantForm.colour?.trim() || null, stockQuantity });
      setVariantForm(EMPTY_VARIANT_FORM); await loadVariants(variantProduct.id);
    } catch (err) { setVariantFormError(err?.response?.data?.message || 'Failed to save variant'); }
    finally { setSubmittingVariant(false); }
  };

  const handleVariantDelete = async (variant) => {
    if (!window.confirm(`Delete variant "${variant.sku}"?`)) return;
    try { await productService.deleteProductVariant(variantProduct.id, variant.id); await loadVariants(variantProduct.id); }
    catch (err) { setVariantFormError(err?.response?.data?.message || 'Failed to delete variant'); }
  };

  const handleVariantStockSave = async (productId, variant) => {
    const stockQuantity = Number(stockDrafts[variant.id]);
    if (Number.isNaN(stockQuantity) || stockQuantity < 0) { setVariantFormError('Stock cannot be negative'); return; }
    try {
      await productService.updateProductVariantStock(productId, variant.id, { stockQuantity });
      setStockDrafts((prev) => ({ ...prev, [variant.id]: undefined })); await loadVariants(productId);
    } catch (err) { setVariantFormError(err?.response?.data?.message || 'Failed to update stock'); }
  };

  const getCategoryName = (categoryId) => categories.find((c) => c.id === categoryId)?.name ?? null;

  const term = search.trim().toLowerCase();
  const visibleProducts = term
    ? products.filter((p) => [p.name, p.slug, p.sku, p.status, getCategoryName(p.categoryId)].some((v) => v && String(v).toLowerCase().includes(term)))
    : products;

  if (loading) {
    return (
      <div>
        <SectionHeader title="Products" subtitle="Manage product catalogue" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white shadow-card p-4 animate-pulse">
              <div className="skeleton h-4 w-56 mb-2" /><div className="skeleton h-3 w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader title="Products" subtitle={`${products.length} products in catalogue`} />
        <button onClick={openCreateForm} className="btn-primary py-2 px-4 text-sm">
          + Add Product
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="flex-shrink-0">⚠</span><span>{error}</span>
        </div>
      )}

      {/* Create / Edit form */}
      {formOpen && (
        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          subtitle={editingProduct ? 'Update product information and gallery' : 'Add a new product and its gallery'}
          onClose={closeForm}
        >
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <IconField id="p-name" label="Name *" icon={ICONS.tag}>
              <input id="p-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field pl-11" placeholder="e.g. Mayura Floral Kurta" />
            </IconField>
            <IconField id="p-slug" label="Slug *" icon={ICONS.link}>
              <input id="p-slug" type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field pl-11 text-sm" placeholder="mayura-floral-kurta" />
            </IconField>
            <IconField id="p-desc" label="Description" icon={ICONS.doc} top className="sm:col-span-2">
              <textarea id="p-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-y pl-11" placeholder="Short product description" />
            </IconField>
            <IconField id="p-category" label="Category" icon={ICONS.grid}>
              <select id="p-category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field pl-11">
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </IconField>
            <IconField id="p-sku" label="SKU *" icon={ICONS.barcode}>
              <input id="p-sku" type="text" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field pl-11 text-sm" placeholder="MB-KU-001" />
            </IconField>
            <IconField id="p-price" label="Price (₹) *" icon={ICONS.rupee}>
              <input id="p-price" type="number" step="0.01" min="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field pl-11" placeholder="1799" />
            </IconField>
            <IconField id="p-sale" label="Sale Price (₹)" icon={ICONS.rupee}>
              <input id="p-sale" type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="input-field pl-11" placeholder="Optional" />
            </IconField>

            <div className="sm:col-span-2">
              <ProductImageManager
                product={editingProduct}
                name={form.name}
                staged={stagedImages}
                onStagedChange={setStagedImages}
                onProductChange={handleProductChange}
                onError={setFormError}
              />
            </div>
            {editingProduct && (
              <div className="sm:col-span-2">
                <TryOnSettings product={editingProduct} />
              </div>
            )}
            {formError && (
              <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                <span>⚠</span><span>{formError}</span>
              </div>
            )}

            {/* footer bar */}
            <div className="-mx-5 -mb-4 mt-1 flex flex-col-reverse items-stretch gap-3 border-t border-[#ece3cf] bg-[#fbf5e6] px-5 py-3 sm:col-span-2 sm:-mx-6 sm:-mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="flex items-center gap-2 text-xs text-[#6b6f6a]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b08d47" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3z" /><path d="m8.5 12 2.5 2.5 4.5-5" />
                </svg>
                {editingProduct ? 'Changes are saved when you update the product' : 'The product is created as a draft'}
              </p>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 gap-2 px-5 py-2 text-sm sm:flex-none">
                  <span aria-hidden="true">✓</span>
                  {submitting ? 'Saving…' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={closeForm} className="btn-outline flex-1 px-5 py-2 text-sm sm:flex-none">Cancel</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {products.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name, slug, SKU, category or status"
          aria-label="Search products"
          className="input-field mt-6 w-full max-w-md text-sm"
        />
      )}

      <div className="mt-4 space-y-3">
        {products.length === 0 ? (
          <div className="bg-white shadow-card p-12 text-center">
            <p className="text-brand-secondary text-sm">No products yet.</p>
            <button onClick={openCreateForm} className="btn-primary mt-4 text-sm py-2.5 px-5">Add Your First Product</button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="bg-white shadow-card p-12 text-center">
            <p className="text-brand-secondary text-sm">No products match "{search.trim()}".</p>
          </div>
        ) : (
          visibleProducts.map((product) => (
            <div key={product.id} className="bg-white shadow-card">
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden border border-brand-border">
                  <ProductImage src={productImageUrl(product.imageFilename)} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-brand-primary">{product.name}</h3>
                    <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${STATUS_STYLES[product.status] || STATUS_STYLES.DRAFT}`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    <span className="text-xs font-mono text-brand-secondary">{product.slug}</span>
                    {getCategoryName(product.categoryId) && (
                      <span className="text-xs text-brand-secondary">Cat: {getCategoryName(product.categoryId)}</span>
                    )}
                    <span className="text-xs text-brand-secondary">SKU: {product.sku}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-semibold text-peacock-deep">{INR.format(product.price)}</span>
                    {product.salePrice != null && (
                      <span className="text-xs text-brand-sale font-medium">Sale: {INR.format(product.salePrice)}</span>
                    )}
                    <span className="text-xs text-brand-secondary">Stock: {product.stockQuantity ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 flex flex-wrap gap-2">
                <button onClick={() => openEditForm(product)} className="btn-ghost py-1.5 px-3 text-xs border border-brand-border hover:border-peacock-teal">Edit</button>
                <button onClick={() => openVariantPanel(product)} className="btn-ghost py-1.5 px-3 text-xs border border-brand-border hover:border-peacock-teal">Variants</button>
                {product.status === 'DRAFT' && (
                  <button onClick={() => handleStatusChange(product, 'PUBLISHED')} className="btn-ghost py-1.5 px-3 text-xs border border-success/30 text-success hover:bg-success/5">Publish</button>
                )}
                {product.status === 'PUBLISHED' && (
                  <>
                    <button onClick={() => handleStatusChange(product, 'DRAFT')} className="btn-ghost py-1.5 px-3 text-xs border border-brand-border">Unpublish</button>
                    <button onClick={() => handleStatusChange(product, 'ARCHIVED')} className="btn-ghost py-1.5 px-3 text-xs border border-orange-200 text-orange-700 hover:bg-orange-50">Archive</button>
                  </>
                )}
                {product.status === 'ARCHIVED' && (
                  <button onClick={() => handleStatusChange(product, 'DRAFT')} className="btn-ghost py-1.5 px-3 text-xs border border-brand-border">Unarchive</button>
                )}
                <button onClick={() => handleDelete(product)} className="btn-ghost py-1.5 px-3 text-xs border border-red-200 text-brand-sale hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {variantPanelOpen && variantProduct && (
        <Modal title={`Variants — ${variantProduct.name}`} onClose={closeVariantPanel}>
<div>
                                    {productVariants.length === 0 ? (
                    <p className="text-xs text-brand-secondary mb-4">No variants yet. Add one below.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {productVariants.map((variant) => (
                        <div key={variant.id} className="bg-white border border-brand-border p-3 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-brand-primary font-mono">{variant.sku}</p>
                            <p className="text-xs text-brand-secondary mt-0.5">
                              {[variant.size && `Size: ${variant.size}${variant.sizeNumber ? ` (${variant.sizeNumber})` : ''}`, variant.colour && `Colour: ${variant.colour}`].filter(Boolean).join(' · ') || 'No attributes'}
                              {' · '}
                              Stock: <strong>{variant.stockQuantity ?? 0}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min="0"
                              value={stockDrafts[variant.id] ?? variant.stockQuantity ?? 0}
                              onChange={(e) => setStockDrafts({ ...stockDrafts, [variant.id]: e.target.value })}
                              className="input-field w-20 py-1.5 text-sm text-center"
                            />
                            <button onClick={() => handleVariantStockSave(variantProduct.id, variant)} className="btn-outline py-1.5 px-3 text-xs">Save Stock</button>
                            <button onClick={() => handleVariantDelete(variant)} className="text-xs text-brand-sale hover:underline font-medium">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleVariantFormSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1">SKU *</label>
                      <input type="text" required value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} className="input-field font-mono text-sm py-1.5" placeholder="MB-KU-001-M" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1">Size</label>
                      <input type="text" value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })} className="input-field py-1.5" placeholder="M" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1">Size (number)</label>
                      <input type="text" inputMode="numeric" maxLength={10} value={variantForm.sizeNumber} onChange={(e) => setVariantForm({ ...variantForm, sizeNumber: e.target.value })} className="input-field py-1.5" placeholder="32" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1">Colour</label>
                      <input type="text" value={variantForm.colour} onChange={(e) => setVariantForm({ ...variantForm, colour: e.target.value })} className="input-field py-1.5" placeholder="Ivory" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1">Stock *</label>
                      <input type="number" min="0" required value={variantForm.stockQuantity} onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: e.target.value })} className="input-field py-1.5" placeholder="10" />
                    </div>
                    {variantFormError && (
                      <div className="col-span-2 sm:col-span-5 text-xs text-brand-sale bg-red-50 border border-red-200 px-3 py-2">
                        {variantFormError}
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-5">
                      <button type="submit" disabled={submittingVariant} className="btn-primary text-sm py-2 px-4">
                        {submittingVariant ? 'Adding…' : '+ Add Variant'}
                      </button>
                    </div>
                  </form>
                </div>
        </Modal>
      )}
    </div>
  );
}

const ICON_PROPS = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#b08d47', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ICONS = {
  tag: <path d="M3 12.6V4a1 1 0 0 1 1-1h8.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0L3.3 13.3a1 1 0 0 1-.3-.7zM8 8h.01" />,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 15h7" /></>,
  grid: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  barcode: <path d="M4 5v14M7 5v14M11 5v14M14 5v14M18 5v14M20 5v14" />,
  rupee: <path d="M7 5h11M7 9h11M7 5c6 0 6 8 0 8l8 7" />,
};

/* Label plus a form control with a gold icon inside its left edge (the control needs pl-11). */
function IconField({ id, label, icon, top = false, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-[#0f3d2e]">{label}</label>
      <div className="relative">
        <svg {...ICON_PROPS} className={`pointer-events-none absolute left-3.5 ${top ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`} aria-hidden="true">{icon}</svg>
        {children}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-peacock-gold" />
        <h2 className="font-serif text-2xl font-bold text-peacock-deep">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-brand-secondary mt-1 ml-3">{subtitle}</p>}
    </div>
  );
}
