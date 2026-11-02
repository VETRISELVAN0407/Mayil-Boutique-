import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as categoryService from '../../services/categoryService';
import { categoryImageUrl } from '../../utils/catalog';
import ProductImage from '../../components/ui/ProductImage';
import Modal from '../../components/ui/Modal';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EMPTY_FORM = { name: '', slug: '', description: '', image: '' };

export default function AdminCategories() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [search, setSearch] = useState('');
  const preview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const loadCategories = async () => {
    if (!accessToken) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getCategories();
      setCategories(data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!accessToken) { setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        const data = await categoryService.getCategories();
        if (!cancelled) setCategories(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken]);

  const openCreateForm = () => {
    setEditingCategory(null); setForm(EMPTY_FORM); setImageFile(null); setRemoveImage(false); setFormError(null); setFormOpen(true);
  };
  const openEditForm = (cat) => {
    setEditingCategory(cat);
    setForm({ name: cat.name ?? '', slug: cat.slug ?? '', description: cat.description ?? '', image: cat.image ?? '' });
    setImageFile(null); setRemoveImage(false); setFormError(null); setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false); setEditingCategory(null); setForm(EMPTY_FORM); setImageFile(null); setRemoveImage(false); setFormError(null);
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { setFormError('Image must be JPEG, PNG or WebP.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setFormError('Image must be 5 MB or smaller.'); return; }
    setFormError(null); setImageFile(file); setRemoveImage(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) { setFormError('Category name and slug are required'); return; }
    setSubmitting(true); setFormError(null);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim(), description: form.description?.trim() || '', image: form.image?.trim() || '' };
      const saved = editingCategory
        ? await categoryService.updateCategory(editingCategory.id, payload)
        : await categoryService.createCategory(payload);
      let imageProblem = null;
      try {
        if (imageFile) await categoryService.setCategoryImage(saved.id, imageFile);
        else if (removeImage && editingCategory?.imageFilename) await categoryService.removeCategoryImage(saved.id);
      } catch (err) {
        imageProblem = err?.response?.data?.message || 'the image could not be uploaded';
      }
      closeForm(); await loadCategories();
      if (imageProblem) setError(`Category saved, but ${imageProblem}. Edit it to try the image again.`);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (cat, status) => {
    try { await categoryService.updateCategoryStatus(cat.id, status); await loadCategories(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to update category status'); }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try { await categoryService.deleteCategory(cat.id); await loadCategories(); }
    catch (err) { setError(err?.response?.data?.message || 'Failed to delete category'); }
  };

  const term = search.trim().toLowerCase();
  const visibleCategories = term
    ? categories.filter((c) => [c.name, c.slug, c.status, c.description].some((v) => v && String(v).toLowerCase().includes(term)))
    : categories;

  if (loading) {
    return (
      <div>
        <SectionHeader title="Categories" subtitle="Manage product categories" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white shadow-card p-4 animate-pulse">
              <div className="skeleton h-4 w-48 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionHeader title="Categories" subtitle={`${categories.length} categories in your catalogue`} />
        <button onClick={openCreateForm} className="btn-primary py-2 px-4 text-sm">
          + Add Category
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span className="flex-shrink-0">⚠</span><span>{error}</span>
        </div>
      )}

      {formOpen && (
        <Modal title={editingCategory ? 'Edit Category' : 'Add Category'} onClose={closeForm}>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cat-name" className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1.5">Name *</label>
              <input id="cat-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Kurtas & Sets" />
            </div>
            <div>
              <label htmlFor="cat-slug" className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1.5">Slug *</label>
              <input id="cat-slug" type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field font-mono text-sm" placeholder="e.g. kurtas-sets" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cat-desc" className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1.5">Description</label>
              <input id="cat-desc" type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Short category description" />
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1.5">Picture</span>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-brand-border bg-white">
                  {preview ? (
                    <img src={preview} alt="New category" className="h-full w-full object-cover" />
                  ) : (
                    <ProductImage
                      src={removeImage ? (form.image.trim() || null) : (editingCategory ? categoryImageUrl({ ...editingCategory, image: form.image.trim() }) : form.image.trim() || null)}
                      alt={form.name || 'Category'}
                      placeholderLabel={form.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="text-xs text-brand-secondary space-y-1">
                  <input id="cat-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImagePick} />
                  <p>JPEG, PNG or WebP, up to 5 MB. Saved when you save the category.</p>
                  {editingCategory?.imageFilename && !imageFile && (
                    <button type="button" onClick={() => setRemoveImage((v) => !v)} className="text-brand-sale hover:underline">
                      {removeImage ? 'Keep the uploaded picture' : 'Remove the uploaded picture'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cat-img" className="block text-xs font-semibold uppercase tracking-widest text-brand-secondary mb-1.5">Or image URL (used only when nothing is uploaded)</label>
              <input id="cat-img" type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input-field" placeholder="https://…" />
            </div>
            {formError && (
              <div className="sm:col-span-2 flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <span>⚠</span><span>{formError}</span>
              </div>
            )}
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary py-2.5 px-5 text-sm">
                {submitting ? 'Saving…' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              <button type="button" onClick={closeForm} className="btn-outline py-2.5 px-5 text-sm">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {categories.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories by name, slug or status"
          aria-label="Search categories"
          className="input-field mt-6 w-full max-w-md text-sm"
        />
      )}

      <div className="mt-4">
        {categories.length === 0 ? (
          <div className="bg-white shadow-card p-12 text-center">
            <p className="text-brand-secondary text-sm">No categories yet.</p>
            <button onClick={openCreateForm} className="btn-primary mt-4 text-sm py-2.5 px-5">Add Your First Category</button>
          </div>
        ) : (
          <div className="bg-white shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-ivory">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary hidden sm:table-cell">Slug</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-widest text-brand-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {visibleCategories.length === 0 && (
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-brand-secondary">No categories match "{search.trim()}".</td></tr>
                )}
                {visibleCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-ivory transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-brand-primary">{cat.name}</div>
                      {cat.description && <div className="text-xs text-brand-secondary mt-0.5 line-clamp-1">{cat.description}</div>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-brand-secondary hidden sm:table-cell">{cat.slug}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${cat.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-gray-100 text-brand-secondary'}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(cat)} className="text-xs text-peacock-teal hover:underline font-medium">Edit</button>
                        <span className="text-brand-border">|</span>
                        <button onClick={() => handleStatusChange(cat, cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className="text-xs text-brand-secondary hover:text-brand-primary font-medium">
                          {cat.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <span className="text-brand-border">|</span>
                        <button onClick={() => handleDelete(cat)} className="text-xs text-brand-sale hover:underline font-medium">Delete</button>
                      </div>
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

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-0">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-peacock-gold" />
        <h2 className="font-serif text-2xl font-bold text-peacock-deep">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-brand-secondary mt-1 ml-3">{subtitle}</p>}
    </div>
  );
}
