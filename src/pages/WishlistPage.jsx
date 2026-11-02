import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useCatalog';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../utils/catalog';
import { formatCurrency } from '../utils/format';
import { discountPercent } from '../utils/pricing';
import ProductImage from '../components/ui/ProductImage';
import PageShell, { EmptyPanel } from '../components/ui/PageShell';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton';

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { products: catalog, loading } = useProducts();
  const toast = useToast();

  // Wishlist rows only carry product ids for guests, so resolve everything against the live catalog.
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const products = items.map((item) => byId.get(item.productId)).filter(Boolean);

  async function handleRemove(product) {
    try {
      await remove(product.id);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (loading) {
    return (
      <PageShell crumb="Wishlist" title="My Wishlist">
        <ProductGridSkeleton count={4} />
      </PageShell>
    );
  }

  if (products.length === 0) {
    return (
      <PageShell crumb="Wishlist" title="My Wishlist" subtitle="Nothing saved yet">
        <EmptyPanel
          title="Your wishlist is empty"
          description="Save your favourite pieces here to shop them later."
          actionLabel="Explore Collection"
          actionTo="/products"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      crumb="Wishlist"
      title="My Wishlist"
      subtitle={`${products.length} ${products.length === 1 ? 'piece' : 'pieces'} you love`}
    >
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const onSale = product.originalPrice && product.originalPrice > product.price;
          const pct = discountPercent(product.price, product.originalPrice);
          return (
            <div key={product.id} className="group relative overflow-hidden rounded-xl bg-white shadow-card transition-shadow duration-250 hover:shadow-card-hover">
              <Link to={`/products/${product.slug}`}>
                <div className="product-img-container bg-[#f3ede2]">
                  <ProductImage src={product.images[0]} alt={product.name} className="product-img" />
                </div>
              </Link>

              <div className="absolute left-3 top-3 flex flex-col gap-2">
                {product.isNew && <span className="rounded bg-[#0f5a3f] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">New</span>}
                {onSale && <span className="rounded bg-[#c1272d] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">Sale</span>}
              </div>

              <button
                onClick={() => handleRemove(product)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#c1272d] shadow-sm transition-colors hover:bg-[#c1272d] hover:text-white"
                aria-label="Remove from wishlist"
                title="Remove from wishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" />
                </svg>
              </button>

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
                {/* Size/colour must be chosen on the product page, so this opens it instead of guessing a variant. */}
                <Link
                  to={`/products/${product.slug}`}
                  className="mt-4 flex h-11 items-center justify-center rounded-md border-2 border-[#0f3d2e] text-sm font-semibold text-[#0f3d2e] transition-colors hover:bg-[#0f3d2e] hover:text-white"
                >
                  Select Size &amp; Add to Bag
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
