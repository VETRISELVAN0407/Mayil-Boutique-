import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as virtualTryOnService from '../../services/virtualTryOnService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTryOnAvailable } from '../../hooks/useTryOn';
import { errorMessage, normalizeProduct } from '../../utils/catalog';
import { formatCurrency } from '../../utils/format';
import PageShell, { EmptyPanel } from '../../components/ui/PageShell';
import ProductImage from '../../components/ui/ProductImage';
import PhotoUploader from '../../components/virtual-try-on/PhotoUploader';
import PhotoGuidelines from '../../components/virtual-try-on/PhotoGuidelines';
import ConsentCheckbox from '../../components/virtual-try-on/ConsentCheckbox';

export default function TryOnUploadPage() {
  const { productId } = useParams();
  const available = useTryOnAvailable();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState({ loading: true, item: null });
  const [photo, setPhoto] = useState(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!available) return undefined;
    let active = true;
    setState({ loading: true, item: null });
    virtualTryOnService.getTryOnProduct(productId)
      .then((item) => active && setState({ loading: false, item: { ...item, product: normalizeProduct(item.product) } }))
      .catch(() => active && setState({ loading: false, item: null }));
    return () => { active = false; };
  }, [available, productId]);

  async function handleGenerate() {
    if (!photo || !consent) return;
    setSubmitting(true);
    setError(null);
    try {
      const job = await virtualTryOnService.createJob(productId, photo.blob, true);
      navigate(`/virtual-try-on/result/${job.id}`);
    } catch (err) {
      const message = errorMessage(err, 'Could not start your preview. Please try again.');
      setError(message);
      toast.error(message);
      setSubmitting(false);
    }
  }

  if (available === false) {
    return (
      <PageShell crumb="Virtual Try-On" title="Virtual Try-On">
        <EmptyPanel title="Coming soon" description="Virtual Try-On is not available yet." actionLabel="Shop now" actionTo="/products" />
      </PageShell>
    );
  }
  if (available === null || state.loading) {
    return <PageShell crumb="Virtual Try-On" title="Virtual Try-On"><div className="h-64 animate-pulse rounded-xl bg-[#f0e6d0]" aria-busy="true" /></PageShell>;
  }
  if (!state.item) {
    return (
      <PageShell crumb="Virtual Try-On" title="Virtual Try-On">
        <EmptyPanel title="Not available" description="This outfit cannot be tried on right now. Please choose another." actionLabel="Choose an outfit" actionTo="/virtual-try-on" />
      </PageShell>
    );
  }

  const { product } = state.item;

  return (
    <PageShell crumb="Virtual Try-On" title="Try it on" subtitle={product.name}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-2xl bg-[#fdf8ee] shadow-card ring-1 ring-[#E8E0D3]">
            <div className="aspect-[3/4] bg-[#f4ecda]">
              <ProductImage src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <h2 className="font-serif text-lg text-[#0f3d2e]">{product.name}</h2>
              <p className="mt-1 font-semibold text-[#10241d]">{formatCurrency(product.price)}</p>
              <Link to="/virtual-try-on" className="mt-3 inline-block text-sm text-[#8a6d2f] underline">Choose a different outfit</Link>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {!isLoggedIn ? (
            <div className="rounded-2xl bg-[#fdf8ee] p-8 text-center ring-1 ring-[#E8E0D3]">
              <h2 className="font-serif text-2xl text-[#0f3d2e]">Sign in to continue</h2>
              <p className="mt-2 text-sm text-[#4a4a3f]">We ask you to sign in so your photo and preview stay private to you.</p>
              <Link to="/login" state={{ from: location.pathname }} className="mt-5 inline-flex rounded-md bg-[#0f3d2e] px-8 py-3 font-semibold text-white hover:bg-[#0a2d22]">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <PhotoUploader photo={photo} onChange={setPhoto} disabled={submitting} />
              <ConsentCheckbox checked={consent} onChange={setConsent} />
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!photo || !consent || submitting}
                className="h-[3.25rem] w-full rounded-md bg-[#0f3d2e] text-lg font-semibold text-white transition-colors hover:bg-[#0a2d22] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Starting…' : 'Generate my preview'}
              </button>
              {(!photo || !consent) && (
                <p className="-mt-3 text-center text-xs text-brand-secondary">
                  {!photo ? 'Add a photo' : 'Accept the consent'} to continue.
                </p>
              )}
            </>
          )}
          <PhotoGuidelines />
        </div>
      </div>
    </PageShell>
  );
}
