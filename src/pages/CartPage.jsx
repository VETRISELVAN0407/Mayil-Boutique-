import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductImage from '../components/ui/ProductImage';
import PageShell, { EmptyPanel } from '../components/ui/PageShell';
import { formatCurrency } from '../utils/format';
import { errorMessage, productImageUrl } from '../utils/catalog';
import { calcSubtotal, lineTotal } from '../utils/pricing';

function Stepper({ value, max, onChange, disabled }) {
  return (
    <div className="inline-flex items-center rounded border border-[#d8cdb4] bg-white">
      <button onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Decrease quantity" className="h-9 w-10 text-lg disabled:opacity-40">−</button>
      <span className="flex h-9 w-11 items-center justify-center border-x border-[#d8cdb4] text-sm">{value}</span>
      <button onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity" className="h-9 w-10 text-lg disabled:opacity-40">+</button>
    </div>
  );
}

export default function CartPage() {
  const { items, update, remove } = useCart();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const subtotal = calcSubtotal(items);
  const hasUnavailable = items.some((i) => i.stockQuantity != null && i.stockQuantity < i.quantity);
  const pieces = items.reduce((sum, i) => sum + i.quantity, 0);

  async function run(variantId, action) {
    setBusyId(variantId);
    try {
      await action();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  function handleCheckout() {
    if (!isLoggedIn) {
      toast.info('Please sign in to proceed to checkout.');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <PageShell crumb="Shopping Bag" title="Shopping Bag" subtitle="Nothing here yet">
        <EmptyPanel
          title="Your bag is empty"
          description="Looks like you have not added anything yet. Start exploring our collection!"
          actionLabel="Continue Shopping"
          actionTo="/products"
        />
      </PageShell>
    );
  }

  return (
    <PageShell crumb="Shopping Bag" title="Shopping Bag" subtitle={`${pieces} ${pieces === 1 ? 'piece' : 'pieces'} in your bag`}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_23.75rem]">
        {/* Items */}
        <div className="space-y-5">
          {items.map((item) => {
            const short = item.stockQuantity != null && item.stockQuantity < item.quantity;
            const hasSale = item.salePrice != null && Number(item.salePrice) < Number(item.price);
            return (
              <div key={item.variantId} className="flex gap-3 rounded-xl bg-white p-3 sm:gap-5 sm:p-4 shadow-card">
                <Link to={`/products/${item.productSlug}`} className="h-[7.5rem] w-[6rem] flex-shrink-0 sm:h-[9.375rem] sm:w-[7.5rem] overflow-hidden rounded-lg bg-[#f3ede2]">
                  <ProductImage src={productImageUrl(item.imageFilename)} alt={item.productName} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-serif text-xs text-[#8a6d2f]">
                        {[item.variantSize, item.variantColour].filter(Boolean).join(' · ')}
                      </p>
                      <Link to={`/products/${item.productSlug}`}>
                        <h3 className="type-product-name mt-1 font-serif text-[#10241d] transition-colors hover:text-peacock-teal">
                          {item.productName}
                        </h3>
                      </Link>
                    </div>
                    <button
                      onClick={() => run(item.variantId, () => remove(item.variantId))}
                      disabled={busyId === item.variantId}
                      className="h-9 w-9 flex-shrink-0 rounded-full text-xl leading-none text-brand-secondary transition-colors hover:bg-[#f3ede2] hover:text-brand-sale"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                  {short && (
                    <p className="mt-1 text-xs text-brand-sale">
                      {item.stockQuantity === 0 ? 'Out of stock' : `Only ${item.stockQuantity} left`} — please reduce the quantity.
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <Stepper
                      value={item.quantity}
                      max={Math.max(1, Math.min(item.stockQuantity ?? 10, 10))}
                      disabled={busyId === item.variantId}
                      onChange={(q) => run(item.variantId, () => update(item.variantId, q))}
                    />
                    <div className="flex items-baseline gap-3">
                      <span className="type-price font-serif font-bold text-[#0f3d2e]">{formatCurrency(lineTotal(item))}</span>
                      {hasSale && (
                        <span className="font-serif text-sm text-brand-secondary line-through">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="rounded-2xl bg-[#fdf8ee] p-6 shadow-card ring-1 ring-[#E8E0D3] lg:sticky lg:top-[7.5rem]">
          <h2 className="border-b border-[#E8E0D3] pb-4 font-serif text-xl text-[#0f3d2e] sm:text-2xl">Order Summary</h2>
          <div className="space-y-3 py-5 text-[0.9375rem]">
            <div className="flex justify-between">
              <span className="text-[#4a4a3f]">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4a4a3f]">Shipping</span>
              <span className="font-semibold text-[#0f5a3f]">Free</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-[#E8E0D3] pt-4">
            <span className="font-serif text-xl text-[#10241d]">Total</span>
            <span className="type-price-lg font-serif font-bold text-[#0f3d2e]">{formatCurrency(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs text-[#4a4a3f]">Payment: Cash on Delivery. Coupons can be applied at checkout.</p>
          <button
            onClick={handleCheckout}
            disabled={hasUnavailable}
            className="mt-5 h-[3.25rem] w-full rounded-md bg-[#0f3d2e] text-lg font-semibold text-white transition-colors hover:bg-[#0a2d22] disabled:opacity-60"
          >
            Proceed to Checkout
          </button>
          <Link to="/products" className="mt-3 block text-center text-sm text-[#4a4a3f] hover:text-peacock-teal">
            ← Continue Shopping
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
