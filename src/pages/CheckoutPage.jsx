import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import * as addressService from '../services/addressService';
import * as couponService from '../services/couponService';
import * as orderService from '../services/orderService';
import PageShell, { EmptyPanel } from '../components/ui/PageShell';
import ProductImage from '../components/ui/ProductImage';
import { formatCurrency } from '../utils/format';
import { errorMessage, productImageUrl } from '../utils/catalog';
import { calcSubtotal, lineTotal } from '../utils/pricing';

const EMPTY_FORM = {
  fullName: '',
  mobile: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  defaultAddress: false,
};

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const { customer, isLoggedIn } = useAuth();
  const { items, clear, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, mobile: customer?.mobile ?? '' });
  const [saving, setSaving] = useState(false);
  const [placing, setPlacing] = useState(false);

  const subtotal = calcSubtotal(items);

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount, subtotal } once validated
  const [couponError, setCouponError] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const discount = coupon ? Number(coupon.discount) : 0;
  const payable = subtotal - discount;

  // A changed cart can change (or invalidate) the discount, so ask the customer to apply the code again.
  useEffect(() => {
    if (coupon && Math.abs(Number(coupon.subtotal) - subtotal) > 0.005) {
      setCoupon(null);
      setCouponError('Your cart changed. Please apply the coupon again.');
    }
  }, [subtotal, coupon]);

  async function handleApplyCoupon(event) {
    event.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      setCoupon(await couponService.validateCoupon(couponInput.trim()));
    } catch (error) {
      setCoupon(null);
      setCouponError(errorMessage(error, 'Could not apply this coupon.'));
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setCoupon(null);
    setCouponInput('');
    setCouponError(null);
  }

  const loadAddresses = useCallback(async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
      setSelectedId((current) => {
        if (current && data.some((a) => a.id === current)) return current;
        return (data.find((a) => a.defaultAddress) ?? data[0])?.id ?? null;
      });
      setShowForm(data.length === 0);
    } catch (error) {
      toast.error(errorMessage(error, 'Could not load your addresses.'));
    } finally {
      setLoadingAddresses(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadAddresses();
  }, [isLoggedIn, loadAddresses]);

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: '/checkout' }} replace />;
  }

  if (items.length === 0 && !placing) {
    return (
      <PageShell crumb="Checkout" title="Checkout">
        <EmptyPanel
          title="Your bag is empty"
          description="Add something you love before checking out."
          actionLabel="Continue Shopping"
          actionTo="/products"
        />
      </PageShell>
    );
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSaveAddress(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await addressService.createAddress(form);
      await loadAddresses();
      setSelectedId(created.id);
      setForm({ ...EMPTY_FORM, mobile: customer?.mobile ?? '' });
      setShowForm(false);
      toast.success('Address saved.');
    } catch (error) {
      toast.error(errorMessage(error, 'Please check the address details.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAddress(id) {
    try {
      await addressService.deleteAddress(id);
      await loadAddresses();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleMakeDefault(id) {
    try {
      await addressService.setDefaultAddress(id);
      await loadAddresses();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handlePlaceOrder() {
    if (!selectedId) {
      toast.error('Please select or add a delivery address.');
      return;
    }
    setPlacing(true);
    try {
      const order = await orderService.placeOrder(selectedId, coupon?.code);
      clear();
      navigate(`/order-success/${order.orderRef}`, { replace: true });
    } catch (error) {
      // Stock or availability changed — re-sync the cart so the page shows what is really there.
      await refresh();
      toast.error(errorMessage(error, 'Could not place your order. Please try again.'));
      setPlacing(false);
    }
  }

  return (
    <PageShell crumb="Checkout" title="Checkout" subtitle="Almost yours">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_23.75rem]">
        <div className="space-y-6">
          {/* Delivery address */}
          <div className="card-cream p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-[#0f3d2e] sm:text-2xl">Delivery Address</h2>
              {!showForm && addresses.length > 0 && (
                <button type="button" onClick={() => setShowForm(true)} className="text-xs text-[#0f5a3f] hover:underline">
                  + Add new address
                </button>
              )}
            </div>

            {loadingAddresses ? (
              <div className="skeleton h-24 w-full" />
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          selectedId === a.id ? 'border-[#0f3d2e] bg-white ring-1 ring-[#0f3d2e]' : 'border-[#d8cdb4] bg-white/60 hover:border-[#0f3d2e]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedId === a.id}
                          onChange={() => setSelectedId(a.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-brand-primary">
                            {a.fullName}
                            {a.defaultAddress && (
                              <span className="ml-2 text-[0.625rem] uppercase tracking-wide text-peacock-teal">Default</span>
                            )}
                          </p>
                          <p className="text-brand-secondary text-xs leading-relaxed mt-1">
                            {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                            {a.city}, {a.state} {a.pincode}<br />
                            +91 {a.mobile}
                          </p>
                          <div className="mt-2 flex gap-4 text-xs">
                            {!a.defaultAddress && (
                              <button type="button" onClick={() => handleMakeDefault(a.id)} className="text-[#0f5a3f] hover:underline">
                                Make default
                              </button>
                            )}
                            <button type="button" onClick={() => handleDeleteAddress(a.id)} className="text-brand-sale hover:underline">
                              Delete
                            </button>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {showForm && (
                  <form onSubmit={handleSaveAddress} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full Name *" className="sm:col-span-2">
                      <input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} className="input-cream" required />
                    </Field>
                    <Field label="Address Line 1 *" className="sm:col-span-2">
                      <input value={form.line1} onChange={(e) => setField('line1', e.target.value)} className="input-cream" placeholder="House / Flat / Street" required />
                    </Field>
                    <Field label="Address Line 2" className="sm:col-span-2">
                      <input value={form.line2} onChange={(e) => setField('line2', e.target.value)} className="input-cream" placeholder="Area / Landmark (optional)" />
                    </Field>
                    <Field label="City *">
                      <input value={form.city} onChange={(e) => setField('city', e.target.value)} className="input-cream" required />
                    </Field>
                    <Field label="State *">
                      <input value={form.state} onChange={(e) => setField('state', e.target.value)} className="input-cream" required />
                    </Field>
                    <Field label="PIN Code *">
                      <input
                        value={form.pincode}
                        onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-cream"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                      />
                    </Field>
                    <Field label="Phone *">
                      <input
                        value={form.mobile}
                        onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="input-cream"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                      />
                    </Field>
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-brand-secondary">
                      <input type="checkbox" checked={form.defaultAddress} onChange={(e) => setField('defaultAddress', e.target.checked)} />
                      Make this my default address
                    </label>
                    <div className="sm:col-span-2 flex gap-3">
                      <button type="submit" disabled={saving} className="btn-green px-6 py-2.5">
                        {saving ? 'Saving…' : 'Save Address'}
                      </button>
                      {addresses.length > 0 && (
                        <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-xs text-brand-secondary">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Payment */}
          <div className="card-cream p-6">
            <h2 className="font-serif text-xl text-[#0f3d2e] sm:text-2xl mb-4">Payment Method</h2>
            <div className="rounded-lg border border-[#0f3d2e] bg-white p-4 text-sm ring-1 ring-[#0f3d2e]">
              <p className="font-semibold text-brand-primary">Cash on Delivery</p>
              <p className="text-xs text-brand-secondary mt-1">Pay in cash when your order is delivered.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placing || !selectedId}
            className="btn-green h-[3.5rem] w-full text-lg"
          >
            {placing ? 'Placing Order…' : `Place Order · ${formatCurrency(payable)}`}
          </button>
        </div>

        {/* Order summary */}
        <div className="space-y-5 lg:sticky lg:top-[7.5rem]">
          <div className="card-cream p-5">
            <h3 className="font-serif text-xl sm:text-2xl normal-case tracking-normal text-[#0f3d2e] mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 items-center">
                  <div className="w-14 h-[4.5rem] flex-shrink-0 overflow-hidden rounded-md bg-[#f3ede2]">
                    <ProductImage src={productImageUrl(item.imageFilename)} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-primary line-clamp-1">{item.productName}</p>
                    <p className="text-[0.625rem] text-brand-secondary mt-0.5">
                      {item.variantSize} · Qty {item.quantity}
                    </p>
                    <p className="font-serif text-sm font-bold text-[#0f3d2e]">{formatCurrency(lineTotal(item))}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-secondary">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-success">
                  <span>Coupon ({coupon.code})</span>
                  <span>−{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-secondary">Shipping</span>
                <span className="text-success">Free</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-brand-border">
                <span>Total</span>
                <span className="font-serif text-xl text-[#0f3d2e] sm:text-2xl">{formatCurrency(payable)}</span>
              </div>
            </div>
          </div>

          <div className="card-cream p-5">
            <h3 className="font-serif text-xl text-[#0f3d2e] sm:text-2xl mb-3">Coupon</h3>
            {coupon ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-success">
                  <strong>{coupon.code}</strong> applied — you save {formatCurrency(discount)}
                </span>
                <button type="button" onClick={handleRemoveCoupon} className="text-xs text-brand-sale hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                  maxLength={32}
                  placeholder="Enter coupon code"
                  aria-label="Coupon code"
                  className="input-cream flex-1 text-sm uppercase"
                />
                <button type="submit" disabled={applyingCoupon || !couponInput.trim()} className="btn-green-outline px-4 disabled:opacity-50">
                  {applyingCoupon ? 'Checking…' : 'Apply'}
                </button>
              </form>
            )}
            {couponError && <p className="mt-2 text-xs text-brand-sale" role="alert">{couponError}</p>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
