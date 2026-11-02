import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/catalog';
import { formatCurrency } from '../../utils/format';
import { discountPercent } from '../../utils/pricing';
import ProductImage from './ProductImage';

const HEART_PARTICLES = [[-26, -26], [0, -34], [26, -26], [-32, 2], [32, 2], [-18, 28], [18, 28]];

export default function ProductCard({ product }) {
  const { isInWishlist, toggle } = useWishlist();
  const toast = useToast();
  const inWishlist = isInWishlist(product.id);
  const [burst, setBurst] = useState(0); // bumped on every add, so the animation restarts
  const burstTimer = useRef(null);
  const burstActive = burst > 0;
  const onSale = product.originalPrice && product.originalPrice > product.price;
  const pct = discountPercent(product.price, product.originalPrice);

  async function handleWishlist() {
    const adding = !inWishlist;
    try {
      await toggle(product.id);
      if (adding) {
        setBurst((n) => n + 1);
        clearTimeout(burstTimer.current);
        burstTimer.current = setTimeout(() => setBurst(0), 800);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white lining-nums shadow-card transition-shadow duration-250 hover:shadow-card-hover">
      {/* Image */}
      <Link to={`/products/${product.slug}`}>
        <div className="product-img-container bg-[#f3ede2]">
          <ProductImage src={product.images[0]} alt={product.name} className="product-img" />
          {/* Hover second image */}
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt=""
              className="product-img absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </div>
      </Link>

      {/* Badges */}
      <div className="absolute left-3 top-3 flex flex-col gap-2">
        {product.isNew && (
          <span className="rounded bg-[#0f5a3f] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">New</span>
        )}
        {onSale && (
          <span className="rounded bg-[#c1272d] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">Sale</span>
        )}
      </div>

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors ${
          inWishlist ? 'text-brand-sale' : 'text-[#0f3d2e] hover:text-brand-sale'
        }`}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {burstActive && (
          <span key={burst} aria-hidden="true">
            <span className="heart-ring" />
            {HEART_PARTICLES.map((p, i) => (
              <span key={i} className="heart-particle" style={{ '--dx': `${p[0]}px`, '--dy': `${p[1]}px` }}>♥</span>
            ))}
          </span>
        )}
        <svg key={burstActive ? burst : 'idle'} className={burstActive ? 'heart-pop' : ''} width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" />
        </svg>
      </button>

      {/* Info */}
      <div className="px-4 pb-5 pt-4">
        <p className="mb-1 font-serif text-xs text-[#8a6d2f]">{product.categoryName}</p>
        <Link to={`/products/${product.slug}`}>
          <h3 className="type-product-name mb-3 line-clamp-2 font-serif text-[#10241d] transition-colors hover:text-peacock-teal">
            {product.name}
          </h3>
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="type-price font-serif font-bold text-[#0f3d2e]">{formatCurrency(product.price)}</span>
          {onSale && (
            <>
              <span className="font-serif text-sm text-brand-secondary line-through">{formatCurrency(product.originalPrice)}</span>
              {pct > 0 && <span className="text-sm font-semibold text-[#8a6d2f]">{pct}% OFF</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
