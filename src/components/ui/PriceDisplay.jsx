import { formatCurrency } from '../../utils/format';
import { discountPercent } from '../../utils/pricing';

export default function PriceDisplay({ price, originalPrice, size = 'md' }) {
  const pct = discountPercent(price, originalPrice);
  const sizeMap = {
    sm: { current: 'text-sm font-semibold', original: 'text-xs', badge: 'text-[0.625rem]' },
    md: { current: 'text-base font-semibold', original: 'text-sm', badge: 'text-xs' },
    lg: { current: 'text-xl font-bold', original: 'text-sm', badge: 'text-xs' },
    xl: { current: 'text-2xl font-bold', original: 'text-base', badge: 'text-xs' },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className={`text-peacock-deep ${s.current}`}>{formatCurrency(price)}</span>
      {originalPrice && originalPrice > price && (
        <>
          <span className={`text-brand-secondary line-through ${s.original}`}>{formatCurrency(originalPrice)}</span>
          {pct > 0 && (
            <span className={`text-brand-sale font-semibold ${s.badge}`}>{pct}% off</span>
          )}
        </>
      )}
    </div>
  );
}
