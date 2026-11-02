import ProductImage from '../ui/ProductImage';
import { formatCurrency } from '../../utils/format';

/** Result screen: generated picture next to the garment, with the follow-up actions. There is deliberately no "save". */
export default function TryOnResult({ resultUrl, product, expiresLabel, busy, onTryAnother, onViewProduct, onAddToCart, onDelete }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-[#E8E0D3]">
        <img src={resultUrl} alt={`AI preview of you wearing ${product.name}`} className="mx-auto max-h-[75vh] w-full rounded-xl object-contain" />
        <p className="mt-3 px-2 pb-1 text-center text-xs text-brand-secondary">
          AI-generated preview for illustration. Actual fit, size and colour may differ.
          {expiresLabel && <> {expiresLabel}</>}
        </p>
      </div>

      <div>
        <div className="flex gap-4 rounded-2xl bg-[#fdf8ee] p-4 ring-1 ring-[#E8E0D3]">
          <div className="h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#f4ecda]">
            <ProductImage src={product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-widest text-[#8a6d2f]">The outfit</p>
            <h2 className="mt-1 font-serif text-xl text-[#0f3d2e]">{product.name}</h2>
            <p className="mt-1 font-semibold text-[#10241d]">
              {formatCurrency(product.price)}
              {product.originalPrice && <span className="ml-2 text-sm font-normal text-brand-secondary line-through">{formatCurrency(product.originalPrice)}</span>}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <button type="button" onClick={onAddToCart} disabled={busy} className="h-12 rounded-md bg-[#0f3d2e] font-semibold text-white transition-colors hover:bg-[#0a2d22] disabled:opacity-60">
            Add to Cart
          </button>
          <button type="button" onClick={onViewProduct} className="h-12 rounded-md border-2 border-[#0f3d2e] bg-white font-semibold text-[#0f3d2e] transition-colors hover:bg-[#fdf8ee]">
            View Product
          </button>
          <button type="button" onClick={onTryAnother} className="h-12 rounded-md border-2 border-[#E3BF72] bg-white font-semibold text-[#8a6d2f] transition-colors hover:bg-[#fdf8ee]">
            Try Another Dress
          </button>
          <button type="button" onClick={onDelete} disabled={busy} className="mt-1 text-sm text-brand-secondary underline hover:text-[#c1272d] disabled:opacity-50">
            Delete my photo and result
          </button>
        </div>
      </div>
    </div>
  );
}
