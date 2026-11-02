import ProductImage from '../ui/ProductImage';
import { formatCurrency } from '../../utils/format';

const TYPE_LABEL = {
  UPPER_BODY: 'Top / Kurti',
  DRESS: 'Dress',
  SALWAR_SUIT: 'Salwar suit',
  SAREE: 'Saree',
  LEHENGA: 'Lehenga',
};

/** One selectable product in the try-on grid. `item` is { product (normalised), garmentType, primaryImageId }. */
export default function TryOnProductCard({ item, onSelect }) {
  const { product } = item;
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group overflow-hidden rounded-xl bg-[#fdf8ee] text-left shadow-card ring-1 ring-[#E8E0D3] transition hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d47]"
    >
      <div className="aspect-[3/4] overflow-hidden bg-[#f4ecda]">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-[0.6875rem] uppercase tracking-widest text-[#8a6d2f]">{TYPE_LABEL[item.garmentType] ?? 'Outfit'}</p>
        <h3 className="mt-1 line-clamp-2 font-serif text-base text-[#0f3d2e] sm:text-lg">{product.name}</h3>
        <p className="mt-1 text-sm font-semibold text-[#10241d]">
          {formatCurrency(product.price)}
          {product.originalPrice && <span className="ml-2 font-normal text-brand-secondary line-through">{formatCurrency(product.originalPrice)}</span>}
        </p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0f3d2e] px-4 py-1.5 text-sm font-medium text-[#E3BF72] transition group-hover:bg-[#0a2d22]">
          Try it on
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </button>
  );
}
