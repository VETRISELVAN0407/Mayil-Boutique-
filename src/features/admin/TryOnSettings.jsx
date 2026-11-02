import { useEffect, useState } from 'react';
import * as productService from '../../services/productService';
import { productImageUrl } from '../../utils/catalog';

// keep in step with GarmentType and TryOnConfigService.MAX_REFERENCE_IMAGES
const GARMENT_TYPES = [
  { value: 'UPPER_BODY', label: 'Kurti / top / shirt / blouse' },
  { value: 'SALWAR_SUIT', label: 'Salwar suit' },
  { value: 'SAREE', label: 'Saree' },
  { value: 'LEHENGA', label: 'Lehenga' },
  { value: 'DRESS', label: 'Dress (full length)' },
];
const MAX_REFERENCES = 3;

const EMPTY = { enabled: false, garmentType: '', aiReady: false, primaryImageId: null, referenceImageIds: [] };

function Thumb({ image, selected, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={label}
      className={`relative h-20 w-16 overflow-hidden rounded border-2 ${selected ? 'border-[#b08d47]' : 'border-transparent hover:border-[#e3d6b4]'}`}
    >
      <img src={productImageUrl(image.filename)} alt="" className="h-full w-full object-cover" />
      {selected && <span className="absolute inset-x-0 bottom-0 bg-[#b08d47] text-[10px] font-semibold text-white">{label}</span>}
    </button>
  );
}

/**
 * Virtual Try-On settings of an existing product (saved with their own button, separate from the product form).
 * The garment images are picked from the product's own gallery; use a clean photo of the garment alone.
 */
export default function TryOnSettings({ product }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text }
  const [capabilities, setCapabilities] = useState(null); // { providerConfigured, supportedGarmentTypes }
  const images = product.images ?? [];
  const imageIds = images.map((i) => i.id).join(',');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setMessage(null);
    productService.getTryOnConfig(product.id)
      .then((c) => { if (!cancelled) setForm({ ...EMPTY, ...c, garmentType: c.garmentType ?? '' }); })
      .catch(() => { if (!cancelled) setMessage({ ok: false, text: 'Could not load Virtual Try-On settings.' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [product.id]);

  useEffect(() => {
    productService.getTryOnCapabilities().then(setCapabilities).catch(() => setCapabilities(null));
  }, []);

  // Gallery edits can remove an image the settings still point at; drop stale ids locally.
  useEffect(() => {
    const ids = new Set(images.map((i) => i.id));
    setForm((f) => ({
      ...f,
      primaryImageId: ids.has(f.primaryImageId) ? f.primaryImageId : null,
      referenceImageIds: f.referenceImageIds.filter((id) => ids.has(id)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageIds]);

  const pickPrimary = (id) => setForm((f) => ({
    ...f,
    primaryImageId: f.primaryImageId === id ? null : id,
    referenceImageIds: f.referenceImageIds.filter((r) => r !== id),
  }));

  const toggleReference = (id) => setForm((f) => {
    if (f.referenceImageIds.includes(id)) return { ...f, referenceImageIds: f.referenceImageIds.filter((r) => r !== id) };
    if (f.referenceImageIds.length >= MAX_REFERENCES) return f;
    return { ...f, referenceImageIds: [...f.referenceImageIds, id] };
  });

  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      const saved = await productService.updateTryOnConfig(product.id, {
        enabled: form.enabled,
        garmentType: form.garmentType || null,
        aiReady: form.aiReady,
        primaryImageId: form.primaryImageId,
        referenceImageIds: form.referenceImageIds,
      });
      setForm({ ...EMPTY, ...saved, garmentType: saved.garmentType ?? '' });
      setMessage({ ok: true, text: 'Virtual Try-On settings saved.' });
    } catch (err) {
      setMessage({ ok: false, text: err?.response?.data?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const live = form.enabled && form.aiReady && form.garmentType && form.primaryImageId;
  const published = product.status === 'PUBLISHED';

  return (
    <section className="rounded-md border border-[#ece3cf] bg-[#fbf5e6]/50 p-4" aria-label="Virtual Try-On">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-primary">Virtual Try-On</h3>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${live && published ? 'bg-success/10 text-success' : 'bg-gray-100 text-brand-secondary'}`}>
          {live ? (published ? 'Visible to customers' : 'Ready (publish the product to show it)') : 'Not visible to customers'}
        </span>
      </div>

      {loading ? <p className="text-sm text-brand-secondary">Loading…</p> : (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            Enable Virtual Try-On for this product
          </label>

          <div>
            <label htmlFor="tryon-type" className="mb-1 block text-xs font-medium">Garment category</label>
            <select id="tryon-type" className="input-field text-sm" value={form.garmentType} onChange={(e) => setForm({ ...form, garmentType: e.target.value })}>
              <option value="">Select…</option>
              {GARMENT_TYPES.map((t) => {
                const supported = !capabilities?.providerConfigured || capabilities.supportedGarmentTypes.includes(t.value);
                return <option key={t.value} value={t.value} disabled={!supported}>{t.label}{supported ? '' : ' (not supported yet)'}</option>;
              })}
            </select>
            {capabilities?.providerConfigured && (
              <p className="mt-1 text-xs text-brand-secondary">Only categories the connected AI engine handles can be enabled.</p>
            )}
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-brand-secondary">Add product pictures above first, then choose the AI-ready garment image here.</p>
          ) : (
            <>
              <div>
                <p className="mb-1 text-xs font-medium">AI-ready garment image</p>
                <p className="mb-2 text-xs text-brand-secondary">Pick a clean photo of the garment only: no collage, text overlay, several products or model-heavy shot.</p>
                <div className="flex flex-wrap gap-2">
                  {images.map((img) => (
                    <Thumb key={img.id} image={img} label="Main" selected={form.primaryImageId === img.id} onClick={() => pickPrimary(img.id)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium">Additional reference images (optional, up to {MAX_REFERENCES})</p>
                <div className="flex flex-wrap gap-2">
                  {images.filter((img) => img.id !== form.primaryImageId).map((img) => (
                    <Thumb key={img.id} image={img} label="Extra" selected={form.referenceImageIds.includes(img.id)} onClick={() => toggleReference(img.id)} />
                  ))}
                </div>
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.aiReady} onChange={(e) => setForm({ ...form, aiReady: e.target.checked })} />
            Images are ready for AI processing
          </label>

          {message && (
            <p role="status" className={`text-sm ${message.ok ? 'text-success' : 'text-red-700'}`}>{message.text}</p>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-primary px-5 py-2 text-sm">
            {saving ? 'Saving…' : 'Save Try-On settings'}
          </button>
        </div>
      )}
    </section>
  );
}
