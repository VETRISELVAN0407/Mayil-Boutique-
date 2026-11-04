import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as productService from '../services/productService';
import { useCategories } from '../hooks/useCatalog';
import { useAuth } from '../context/AuthContext';
import { useTryOnEligible } from '../hooks/useTryOn';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, indexById, normalizeProduct } from '../utils/catalog';
import { formatCurrency, formatDate } from '../utils/format';
import { discountPercent } from '../utils/pricing';
import { flyToBag } from '../utils/flyToBag';
import ProductImage from '../components/ui/ProductImage';
import EmptyState from '../components/ui/EmptyState';
import ProductReviews from '../components/reviews/ProductReviews';

const DELIVERY_MIN_DAYS = 3;
const DELIVERY_MAX_DAYS = 5;

// Swatch colours for the common names; anything else falls back to a neutral.
const COLOUR_HEX = {
  maroon: '#6b0f1a', ivory: '#f6ecd6', red: '#b3202a', green: '#0f5a3f', 'bottle green': '#0b4a35', emerald: '#0f6b4a',
  blue: '#1f4e9a', navy: '#14213d', 'midnight blue': '#101a3a', pink: '#e58aa6', 'rani pink': '#d6336c', magenta: '#a8195f',
  yellow: '#e8c13a', mustard: '#c9962a', orange: '#e0742a', purple: '#5b2a86', plum: '#5a1f4a', wine: '#5b1424',
  teal: '#0e7773', peacock: '#0b6e75', black: '#1b1b1b', white: '#fbfaf5', cream: '#f4e8cc', gold: '#c9a24a',
  silver: '#bdbdbd', grey: '#8b8b8b', gray: '#8b8b8b', brown: '#6d4527', beige: '#e5d3b3', lavender: '#b9a4d6',
  mint: '#a6d9c2', indigo: '#2c3a7a', turquoise: '#2bb5ad', peach: '#f4b99a', rust: '#a8461f', olive: '#6b6b2a',
};
const colourHex = (name) => COLOUR_HEX[name.trim().toLowerCase()] ?? '#d9cdb4';

/* The cropped art has a slightly different cream than the page, so every edge is faded out. */
const fadeMask = (...gradients) => ({
  mixBlendMode: 'multiply',
  WebkitMaskImage: gradients.join(', '),
  WebkitMaskComposite: 'source-in',
  maskImage: gradients.join(', '),
  maskComposite: 'intersect',
});
const FADE_RIGHT = 'linear-gradient(to right, #000 55%, transparent)';
const FADE_LEFT = 'linear-gradient(to left, #000 55%, transparent)';
const FADE_BOTTOM = 'linear-gradient(to bottom, #000 65%, transparent)';
const FADE_TOP = 'linear-gradient(to bottom, transparent, #000 12%)';

const SMALL_ICON = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: '#b08d47', strokeWidth: 1.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E3BF72]/50">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-3.5 text-left font-semibold text-[#10241d]"
      >
        {title}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-3 pb-4 text-sm leading-relaxed text-[#4a4a3f]">{children}</div>}
    </div>
  );
}

function Ornament() {
  return (
    <div className="my-3 flex items-center gap-2" aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-[#E3BF72] to-[#E3BF72]/20" />
      <svg width="40" height="10" viewBox="0 0 40 10" fill="none" stroke="#b08d47" strokeWidth="1"><path d="M0 5h12M28 5h12M20 1l4 4-4 4-4-4z" /></svg>
      <span className="h-px flex-1 bg-gradient-to-l from-[#E3BF72] to-[#E3BF72]/20" />
    </div>
  );
}

/* A rough window, not a courier promise: the store has no delivery-time rules yet. */
function deliveryWindow() {
  const day = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };
  const from = day(DELIVERY_MIN_DAYS).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const to = day(DELIVERY_MAX_DAYS).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${from} – ${to}`;
}


export default function ProductDetailPage() {
  const { slug } = useParams();
  const categories = useCategories();
  const [state, setState] = useState({ loading: true, product: null, variants: [] });

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColour, setSelectedColour] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [busy, setBusy] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const mainImageRef = useRef(null);
  const addedTimer = useRef(null);
  const [wishlistPulse, setWishlistPulse] = useState(0);

  const { customer } = useAuth();
  const { items: cartItems, add: addToCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const toast = useToast();

  useEffect(() => {
    let active = true;
    setState({ loading: true, product: null, variants: [] });
    setSelectedSize(null);
    setSelectedColour(null);
    setQty(1);
    setActiveImg(0);
    Promise.all([
      productService.getPublicProductBySlug(slug),
      productService.getPublicProductVariantsBySlug(slug),
    ])
      .then(([product, variants]) => active && setState({ loading: false, product, variants: variants ?? [] }))
      .catch(() => active && setState({ loading: false, product: null, variants: [] }));
    return () => {
      active = false;
    };
  }, [slug]);

  const product = useMemo(
    () => (state.product ? normalizeProduct(state.product, indexById(categories)) : null),
    [state.product, categories]
  );
  const { variants } = state;
  const canTryOn = useTryOnEligible(state.product?.id);

  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))], [variants]);
  // Numeric size shown next to the letter, e.g. M -> 32, taken from any variant of that size.
  const sizeNumbers = useMemo(() => {
    const map = {};
    variants.forEach((v) => { if (v.size && v.sizeNumber && !map[v.size]) map[v.size] = v.sizeNumber; });
    return map;
  }, [variants]);
  const colours = useMemo(() => [...new Set(variants.map((v) => v.colour).filter(Boolean))], [variants]);
  const matches = (v) =>
    (!sizes.length || v.size === selectedSize) && (!colours.length || v.colour === selectedColour);
  const selectedVariant = variants.find(matches) ?? null;
  const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0);
  const inCart = selectedVariant
    ? (cartItems.find((i) => i.variantId === selectedVariant.id)?.quantity ?? 0)
    : 0;

  // A size/colour is only offered if some in-stock variant carries it.
  const optionAvailable = (key, value) =>
    variants.some((v) => v[key] === value && v.stockQuantity > 0);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-[78.3125rem] px-4 py-8">
        <div className="skeleton aspect-[588/676] w-full max-w-[36.75rem]" />
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon="👗"
        title="Product not found"
        description="This product may be unavailable or the link may have changed."
        actionLabel="Browse all products"
        actionTo="/products"
      />
    );
  }

  const inWishlist = isInWishlist(product.id);

  async function handleAddToCart() {
    if (sizes.length && !selectedSize) return toast.error('Please select a size.');
    if (colours.length && !selectedColour) return toast.error('Please select a colour.');
    if (!selectedVariant) return toast.error('This combination is not available.');
    if (selectedVariant.stockQuantity === 0) return toast.error('Sorry, this item is out of stock.');

    setBusy(true);
    try {
      // The cart replaces a line's quantity, so add on top of what is already there.
      const quantity = Math.min(inCart + qty, selectedVariant.stockQuantity);
      await addToCart(selectedVariant.id, quantity, {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantSku: selectedVariant.sku,
        variantSize: selectedVariant.size,
        variantColour: selectedVariant.colour,
        price: state.product.price,
        salePrice: state.product.salePrice,
        stockQuantity: selectedVariant.stockQuantity,
        imageFilename: state.product.imageFilename,
      });
      flyToBag(mainImageRef.current, product.images[activeImg]);
      setJustAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setJustAdded(false), 1800);
      toast.success(`${product.name} added to bag!`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleWishlist() {
    try {
      await toggleWishlist(product.id);
      if (!inWishlist) setWishlistPulse((n) => n + 1);
      toast.info(inWishlist ? 'Removed from wishlist.' : 'Added to wishlist!');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `${product.name} · Mayil Boutique`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch (error) {
      if (error?.name === 'AbortError') return; // the customer closed the share sheet
      toast.error('Could not share. Please copy the link from the address bar.');
    }
  }

  const maxQty = selectedVariant ? Math.max(1, Math.min(selectedVariant.stockQuantity, 10)) : 10;
  const soldOut = variants.length === 0 || totalStock === 0;
  const onSale = product.originalPrice && product.originalPrice > product.price;
  const pct = discountPercent(product.price, product.originalPrice);
  const images = product.images;
  const step = (delta) => setActiveImg((i) => (i + delta + images.length) % images.length);

  return (
    <div className="relative overflow-x-clip bg-[#fdf3e1]">
      {/* decorative florals and feather */}
      <img src="/pdp-floral.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute left-0 top-0 hidden w-[8.75rem] opacity-70 xl:block" style={fadeMask(FADE_RIGHT, FADE_BOTTOM)} />
      <img src="/pdp-floral.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute right-0 top-[25rem] hidden w-[8.75rem] -scale-x-100 opacity-70 xl:block" style={fadeMask(FADE_RIGHT, FADE_TOP)} />
      <img
        src="/pdp-feather.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 hidden w-[16.625rem] xl:block"
        style={fadeMask(FADE_LEFT, FADE_BOTTOM)}
      />

      <div className="relative mx-auto max-w-[78.3125rem] px-4 pb-16 pt-8 sm:px-6 xl:px-0">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[41rem_1fr] lg:gap-12">
          {/* Image gallery: thumbnails on the left, the picture with wishlist/share buttons on its right edge */}
          <div className="flex gap-3 sm:gap-4">
            {images.length > 1 && (
              <div className="relative w-14 flex-shrink-0 sm:w-[5.5625rem]">
                <div className="no-scrollbar absolute inset-0 flex flex-col gap-3 overflow-y-auto" aria-label="Product images">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === activeImg}
                      className={`aspect-[89/100] w-full flex-shrink-0 overflow-hidden rounded-sm border-2 transition-colors ${i === activeImg ? 'border-[#E3A52B]' : 'border-transparent'}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={mainImageRef} className="relative aspect-[588/676] min-w-0 flex-1 overflow-hidden rounded-sm bg-[#f3ede2] shadow-card">
              <ProductImage src={images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="bg-white px-4 py-2 text-sm font-semibold">Out of Stock</span>
                </div>
              )}
              <div className="absolute right-3 top-3 flex flex-col gap-3 sm:right-4 sm:top-4">
                <button
                  onClick={handleWishlist}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={inWishlist}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 shadow transition-transform hover:scale-105"
                >
                  <svg key={wishlistPulse} className={wishlistPulse > 0 ? 'heart-pop' : ''} width="24" height="24" viewBox="0 0 24 24" fill={inWishlist ? '#c1272d' : 'none'} stroke={inWishlist ? '#c1272d' : '#10241d'} strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" /></svg>
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Share this product"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 shadow transition-transform hover:scale-105"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10241d" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"><path d="M21 3 3 10.5l7 3 3 7z" /><path d="m10 13.5 4-4" /></svg>
                </button>
              </div>
              {images.length > 0 && (
                <button
                  onClick={() => setZoomOpen(true)}
                  aria-label="Zoom image"
                  className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#10241d] shadow sm:bottom-4 sm:right-4"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" /></svg>
                </button>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => step(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#10241d] shadow sm:left-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 6-6 6 6 6" /></svg>
                  </button>
                  <button onClick={() => step(1)} aria-label="Next image" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#10241d] shadow sm:right-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m9 6 6 6-6 6" /></svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="min-w-0 text-[#10241d]">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
              <Link to="/" className="hover:text-peacock-teal">Home</Link> /
              <Link to="/products" className="hover:text-peacock-teal">All Products</Link> /
              {product.categorySlug && (
                <>
                  <Link to={`/category/${product.categorySlug}`} className="hover:text-peacock-teal">{product.categoryName}</Link> /
                </>
              )}
              <span className="font-medium">{product.name}</span>
            </nav>

            <div className="mt-5 flex gap-3">
              {product.isNew && <span className="rounded bg-[#128a3e] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white">New</span>}
              {onSale && <span className="rounded bg-[#c1272d] px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white">Sale</span>}
            </div>

            {product.categoryName && (
              <p className="mt-5 text-base font-semibold uppercase tracking-wide text-[#b8860b]">{product.categoryName}</p>
            )}
            <h1 className="mt-1 type-page font-serif font-medium text-[#0f3d2e]">{product.name}</h1>
            <div className="max-w-[14.375rem]"><Ornament /></div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span className="type-price-lg font-serif font-bold text-[#0f3d2e]">{formatCurrency(product.price)}</span>
              {onSale && (
                <>
                  <span className="font-serif text-xl text-brand-secondary line-through">{formatCurrency(product.originalPrice)}</span>
                  {pct > 0 && <span className="rounded bg-[#f6dd9d] px-3 py-1 text-sm font-semibold text-[#5c4510]">{pct}% OFF</span>}
                </>
              )}
            </div>
            {product.saleName && onSale && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-sale">
                {product.saleName}
                {product.saleEndsAt && <span className="font-normal normal-case text-brand-secondary"> · ends {formatDate(product.saleEndsAt)}</span>}
              </p>
            )}

            {product.description && (
              <p className="mt-5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-[#2d2d26]">{product.description}</p>
            )}

            <div className="my-6 flex items-center gap-2" aria-hidden="true">
              <span className="h-px flex-1 bg-[#E3BF72]/70" />
              <svg width="30" height="8" viewBox="0 0 30 8" fill="none" stroke="#b08d47" strokeWidth="1"><path d="M0 4h10M20 4h10M15 1l3 3-3 3-3-3z" /></svg>
              <span className="h-px w-8 bg-[#E3BF72]/70" />
            </div>

            {/* Delivery estimate */}
            <div className="flex items-start gap-4">
              <svg {...SMALL_ICON} stroke="#10241d" className="mt-1 flex-shrink-0"><path d="M2 6h12v10H2zM14 9h4l3 3v4h-7M6 19a1.6 1.6 0 1 0 0-.01M17 19a1.6 1.6 0 1 0 0-.01" /></svg>
              <div className="text-sm">
                <p className="font-medium">Delivery Estimate</p>
                <p className="mt-1 text-[0.9375rem]">Get it by <span className="font-semibold text-[#0f5a3f]">{deliveryWindow()}</span></p>
              </div>
            </div>

            {/* Colour */}
            {colours.length > 0 && (
              <div className="mt-8 flex flex-wrap items-start gap-x-5 gap-y-2">
                <p className="mt-3 font-semibold">Color:</p>
                {colours.map((c) => {
                  const selected = selectedColour === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedColour(c)}
                      disabled={!optionAvailable('colour', c)}
                      aria-pressed={selected}
                      className="flex w-[4.25rem] flex-col items-center gap-1.5 text-xs disabled:opacity-40"
                    >
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${selected ? 'border-[#0f3d2e]' : 'border-transparent'}`}>
                        <span className="h-9 w-9 rounded-full border border-black/10" style={{ backgroundColor: colourHex(c) }} />
                      </span>
                      <span className={selected ? 'font-semibold' : ''}>{c}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Size */}
            {sizes.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <p className="font-semibold">Size:</p>
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    disabled={!optionAvailable('size', s)}
                    aria-pressed={selectedSize === s}
                    className={`min-w-[2.75rem] rounded border px-3.5 py-2 text-sm transition-colors disabled:line-through disabled:opacity-40 ${
                      selectedSize === s ? 'border-[#0f3d2e] bg-white font-medium ring-1 ring-[#0f3d2e]' : 'border-[#d8cdb4] bg-white/60 hover:border-[#0f3d2e]'
                    }`}
                  >
                    {s}{sizeNumbers[s] ? ` (${sizeNumbers[s]})` : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Qty */}
            <div className="mt-6 flex items-center gap-4">
              <p className="font-semibold">Quantity:</p>
              <div className="inline-flex items-center rounded border border-[#d8cdb4] bg-white">
                <button onClick={() => setQty(Math.max(1, Math.min(qty, maxQty) - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="h-10 w-11 text-lg disabled:opacity-40">−</button>
                <span className="flex h-10 w-12 items-center justify-center border-x border-[#d8cdb4] text-sm">{Math.min(qty, maxQty)}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} aria-label="Increase quantity" className="h-10 w-11 text-lg disabled:opacity-40">+</button>
              </div>
            </div>
            {selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity <= 5 && (
              <p className="mt-2 text-xs text-brand-sale">Only {selectedVariant.stockQuantity} left!</p>
            )}
            {selectedVariant && inCart > 0 && <p className="mt-2 text-xs text-brand-secondary">{inCart} already in your bag.</p>}

            {/* CTA buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={handleAddToCart}
                disabled={soldOut || busy}
                className={`relative flex h-[3.25rem] items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md px-2 text-[0.9375rem] font-semibold transition-colors disabled:opacity-60 sm:gap-3 sm:text-lg ${
                  justAdded ? 'bg-[#128a3e] text-white' : 'bg-[#0f3d2e] text-white hover:bg-[#0a2d22]'
                }`}
              >
                {justAdded ? (
                  <>
                    <svg className="heart-pop" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                    Added to Bag
                    {[-1, 0, 1].map((n) => (
                      <span key={n} className="heart-particle" style={{ '--dx': `${n * 46}px`, '--dy': '-34px', left: '50%', top: '40%', color: '#E3BF72' }} aria-hidden="true">✦</span>
                    ))}
                  </>
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#E3BF72" stroke="#E3BF72" strokeWidth="1.5" strokeLinejoin="round"><path d="M5 8h14l1 13H4L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" /></svg>
                    {soldOut ? 'Out of Stock' : busy ? 'Adding…' : 'Add to Bag'}
                  </>
                )}
              </button>
              <button
                onClick={handleWishlist}
                className="flex h-[3.25rem] items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-[#0f3d2e] bg-white px-2 text-[0.9375rem] font-semibold text-[#0f3d2e] transition-colors hover:bg-[#fdf8ee] sm:gap-3 sm:text-lg"
              >
                <svg key={wishlistPulse} className={wishlistPulse > 0 ? 'heart-pop' : ''} width="24" height="24" viewBox="0 0 24 24" fill={inWishlist ? '#c1272d' : 'none'} stroke={inWishlist ? '#c1272d' : 'currentColor'} strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" /></svg>
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
            {canTryOn && (
              <Link
                to={`/virtual-try-on/${product.id}`}
                className="mt-4 flex h-[3.25rem] items-center justify-center gap-3 rounded-md border-2 border-[#E3BF72] bg-[#fdf8ee] text-lg font-semibold text-[#8a6d2f] transition-colors hover:bg-[#f7ecd0]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
                Try It On
              </Link>
            )}
            {!customer && <p className="mt-3 text-xs text-brand-secondary">Sign in at checkout to place your order.</p>}

            {/* Trust row */}
            <div className="mt-6 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-3">
              {[
                { label: 'Secure Checkout', icon: <><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></> },
                { label: 'Easy Returns', icon: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /> },
                { label: 'Handcrafted Quality', icon: <path d="M6 3h12l4 6-10 12L2 9zM2 9h20M9 3 7 9l5 12 5-12-2-6" /> },
              ].map((t, i) => (
                <div key={t.label} className={`flex items-center justify-center gap-3 ${i > 0 ? 'sm:border-l sm:border-[#E3BF72]/50' : ''}`}>
                  <svg {...SMALL_ICON}>{t.icon}</svg>
                  {t.label}
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="mt-7 border-t border-[#E3BF72]/50">
              <Accordion title="Product Details">
                <ul className="space-y-1">
                  {product.categoryName && <li>Category: {product.categoryName}</li>}
                  {state.product.sku && <li>SKU: {state.product.sku}</li>}
                  {colours.length > 0 && <li>Colours: {colours.join(', ')}</li>}
                  {sizes.length > 0 && <li>Sizes: {sizes.join(', ')}</li>}
                </ul>
              </Accordion>
              <Accordion title="Shipping & Returns">
                <p>
                  Cash on delivery is available on every order. Read our{' '}
                  <Link to="/policy/shipping" className="underline">shipping policy</Link> and{' '}
                  <Link to="/policy/returns" className="underline">returns policy</Link> for details.
                </p>
              </Accordion>
            </div>
          </div>
        </div>

        <ProductReviews product={product} />
      </div>

      {zoomOpen && images[activeImg] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={() => setZoomOpen(false)} role="dialog" aria-modal="true">
          <button className="absolute right-5 top-5 text-3xl text-white" aria-label="Close zoom" onClick={() => setZoomOpen(false)}>×</button>
          <img src={images[activeImg]} alt={product.name} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
