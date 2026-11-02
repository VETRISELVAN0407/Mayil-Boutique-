import { useEffect, useMemo, useRef, useState } from 'react';
import * as productService from '../../services/productService';
import { productImageUrl } from '../../utils/catalog';
import ProductImage from '../../components/ui/ProductImage';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8; // keep in step with ProductImageService.MAX_IMAGES

/**
 * Pictures of one product, cover first. For an existing product every change is saved straight away and the
 * updated product is handed back through `onProductChange`; for a new product the chosen files are only staged
 * (`staged`) and uploaded together with the create request.
 */
export default function ProductImageManager({ product, name, staged, onStagedChange, onProductChange, onError }) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const saved = product?.images ?? [];
  const total = saved.length + staged.length;
  const full = total >= MAX_IMAGES;

  const previews = useMemo(() => staged.map((file) => URL.createObjectURL(file)), [staged]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const problemWith = (files) => {
    if (total + files.length > MAX_IMAGES) return `A product can have at most ${MAX_IMAGES} images.`;
    if (files.some((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))) return 'Images must be JPEG, PNG or WebP.';
    if (files.some((file) => file.size > MAX_IMAGE_BYTES)) return 'Each image must be 5 MB or smaller.';
    return null;
  };

  const run = async (action, failure) => {
    setBusy(true); onError(null);
    try { onProductChange(await action()); }
    catch (err) { onError(err?.response?.data?.message || failure); }
    finally { setBusy(false); }
  };

  const addFiles = (files) => {
    if (files.length === 0) return;
    const problem = problemWith(files);
    if (problem) { onError(problem); return; }
    onError(null);
    if (product) run(() => productService.addProductImages(product.id, files), 'Failed to upload images');
    else onStagedChange([...staged, ...files]);
  };

  const handleSelect = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    addFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (busy || full) return;
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const makeCover = (image) => run(
    () => productService.reorderProductImages(product.id, [image.id, ...saved.filter((i) => i.id !== image.id).map((i) => i.id)]),
    'Failed to change the cover image',
  );

  const remove = (image) => {
    if (!window.confirm('Remove this image?')) return;
    run(() => productService.deleteProductImage(product.id, image.id), 'Failed to remove the image');
  };

  const tile = (isCover) =>
    `group relative h-28 w-[8.5rem] flex-shrink-0 overflow-hidden rounded-lg bg-white ${
      isCover ? 'ring-2 ring-[#d9b25f] ring-offset-2 ring-offset-[#fdf9ef]' : 'ring-1 ring-[#e3d8c0]'
    }`;
  const coverBadge = (
    <span className="absolute left-2 top-2 rounded bg-[#0f3d2e] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Cover</span>
  );
  const removeButton = (onClick, disabled) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Remove image"
      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-sm leading-none text-[#0f3d2e] shadow transition-colors hover:bg-[#a43d42] hover:text-white disabled:opacity-40"
    >
      ×
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="flex items-center gap-3 font-serif text-lg text-[#0f3d2e]">
          <span className="h-0.5 w-8 bg-[#d9b25f]" aria-hidden="true" />
          Product Gallery
        </span>
        <span className="text-xs text-[#6b6f6a]">
          {total} of {MAX_IMAGES} images · First image is the cover
          {product ? ' · Changes here are saved immediately' : ' · Uploaded when you create the product'}
          {busy && ' · Saving…'}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {saved.map((image, index) => (
          <div key={image.id} className={tile(index === 0)}>
            <ProductImage src={productImageUrl(image.filename)} alt={`${name || 'Product'} ${index + 1}`} className="h-full w-full object-cover" />
            {index === 0 && coverBadge}
            {removeButton(() => remove(image), busy)}
            {index > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => makeCover(image)}
                className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#0f3d2e] shadow transition-colors hover:bg-[#0f3d2e] hover:text-white disabled:opacity-40"
              >
                <span aria-hidden="true">☆</span> Make cover
              </button>
            )}
          </div>
        ))}

        {staged.map((file, index) => (
          <div key={`${file.name}-${index}`} className={tile(saved.length === 0 && index === 0)}>
            <img src={previews[index]} alt={file.name} className="h-full w-full object-cover" />
            {saved.length === 0 && index === 0 && coverBadge}
            {removeButton(() => onStagedChange(staged.filter((_, i) => i !== index)), false)}
          </div>
        ))}

        {total === 0 && (
          <div className={tile(false)}>
            <ProductImage alt={name || 'Product'} placeholderLabel={name} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Drop zone */}
      <label
        htmlFor="p-image"
        onDragOver={(e) => { e.preventDefault(); if (!full) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-3 flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed px-4 py-3.5 text-center transition-colors ${
          full ? 'cursor-not-allowed border-[#e3d8c0] opacity-60' : 'cursor-pointer hover:bg-[#fbf3df]'
        } ${dragging ? 'border-[#0f3d2e] bg-[#fbf3df]' : 'border-[#d9b25f]'}`}
      >
        <span className="flex items-center gap-3 text-sm text-[#2d2d26]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d9a441" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 18a4.5 4.5 0 0 1-.6-8.97A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5" /><path d="M12 21v-8M9 15.5l3-3 3 3" />
          </svg>
          {full ? 'Image limit reached' : <>Drag images here or <span className="font-semibold text-[#0f3d2e] underline">browse files</span></>}
        </span>
        <span className="text-xs text-[#6b6f6a]">JPEG, PNG or WebP · Up to 5 MB each</span>
        <input
          id="p-image"
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || full}
          onChange={handleSelect}
          className="sr-only"
        />
      </label>
    </div>
  );
}
