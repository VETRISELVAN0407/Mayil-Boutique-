import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as virtualTryOnService from '../../services/virtualTryOnService';
import * as productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage, normalizeProduct } from '../../utils/catalog';
import PageShell from '../../components/ui/PageShell';
import GenerationProgress from '../../components/virtual-try-on/GenerationProgress';
import TryOnResult from '../../components/virtual-try-on/TryOnResult';

const POLL_MS = 2000;
const MAX_CONSECUTIVE_ERRORS = 5;

function Notice({ title, children, actions }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-[#fdf8ee] px-8 py-12 text-center shadow-card ring-1 ring-[#E8E0D3]" role="status">
      <h2 className="font-serif text-2xl text-[#0f3d2e]">{title}</h2>
      <p className="mt-2 text-sm text-[#4a4a3f]">{children}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

const primaryBtn = 'rounded-md bg-[#0f3d2e] px-6 py-2.5 font-semibold text-white hover:bg-[#0a2d22]';
const ghostBtn = 'rounded-md border-2 border-[#0f3d2e] px-6 py-2.5 font-semibold text-[#0f3d2e] hover:bg-[#fdf8ee]';

export default function TryOnResultPage() {
  const { jobId } = useParams();
  const { isLoggedIn } = useAuth();
  const { items: cartItems, add: addToCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [gone, setGone] = useState(false); // job unknown / deleted
  const [connectionLost, setConnectionLost] = useState(false);
  const [pollKey, setPollKey] = useState(0); // bump to restart polling after a lost connection
  const [resultUrl, setResultUrl] = useState(null);
  const [product, setProduct] = useState(null);
  const [busy, setBusy] = useState(false);
  const urlRef = useRef(null);

  // Poll until the job reaches a final state.
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let active = true;
    let timer;
    let errors = 0;
    setConnectionLost(false);

    async function tick() {
      try {
        const next = await virtualTryOnService.getJob(jobId);
        if (!active) return;
        errors = 0;
        setJob(next);
        if (next.status === 'PENDING' || next.status === 'PROCESSING') timer = setTimeout(tick, POLL_MS);
      } catch (err) {
        if (!active) return;
        if (err?.response?.status === 404) {
          setGone(true);
        } else if (++errors >= MAX_CONSECUTIVE_ERRORS) {
          setConnectionLost(true);
        } else {
          timer = setTimeout(tick, POLL_MS * 2);
        }
      }
    }
    tick();
    return () => { active = false; clearTimeout(timer); };
  }, [jobId, isLoggedIn, pollKey]);

  // Fetch the picture once it is ready; the object URL is freed when this page goes away.
  useEffect(() => {
    if (job?.status !== 'COMPLETED' || !job.resultAvailable || urlRef.current) return undefined;
    let active = true;
    virtualTryOnService.getResultBlob(jobId)
      .then((blob) => {
        if (!active) return;
        urlRef.current = URL.createObjectURL(blob);
        setResultUrl(urlRef.current);
      })
      .catch((err) => {
        if (!active) return;
        if ([404, 409, 410].includes(err?.response?.status)) setJob((j) => ({ ...j, status: 'EXPIRED' }));
        else setConnectionLost(true);
      });
    return () => { active = false; };
  }, [job, jobId]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  // The product (for name, price, "View product", "Add to cart"). Missing is fine: the page still shows the result.
  useEffect(() => {
    if (!job?.productId) return undefined;
    let active = true;
    virtualTryOnService.getTryOnProduct(job.productId)
      .then((item) => active && setProduct(normalizeProduct(item.product)))
      .catch(() => active && setProduct(null));
    return () => { active = false; };
  }, [job?.productId]);

  const removeJob = useCallback(async () => {
    setBusy(true);
    try {
      await virtualTryOnService.deleteJob(jobId);
      return true;
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete. Please try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  }, [jobId, toast]);

  async function handleCancel() {
    if (await removeJob()) navigate('/virtual-try-on');
  }

  async function handleDelete() {
    if (await removeJob()) {
      toast.success('Your photo and result were deleted.');
      navigate('/virtual-try-on');
    }
  }

  async function handleAddToCart() {
    if (!product) return;
    setBusy(true);
    try {
      const variants = (await productService.getPublicProductVariantsBySlug(product.slug)).filter((v) => v.stockQuantity > 0);
      if (variants.length !== 1) {
        toast.info('Please choose your size on the product page.');
        navigate(`/products/${product.slug}`);
        return;
      }
      const variant = variants[0];
      const inCart = cartItems.find((i) => i.variantId === variant.id)?.quantity ?? 0;
      await addToCart(variant.id, Math.min(inCart + 1, variant.stockQuantity));
      toast.success(`${product.name} added to bag!`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <PageShell crumb="Virtual Try-On" title="Your preview">
        <Notice title="Sign in to see your preview" actions={<Link to="/login" state={{ from: `/virtual-try-on/result/${jobId}` }} className={primaryBtn}>Sign in</Link>}>
          Previews are private to the customer who created them.
        </Notice>
      </PageShell>
    );
  }

  const chooseAnother = <Link to="/virtual-try-on" className={ghostBtn}>Choose an outfit</Link>;
  const retry = job?.productId ? <Link to={`/virtual-try-on/${job.productId}`} className={primaryBtn}>Try again</Link> : null;

  let body;
  if (gone || job?.status === 'EXPIRED' || job?.status === 'CANCELLED') {
    body = (
      <Notice title="This preview is no longer available" actions={<>{retry}{chooseAnother}</>}>
        Previews and photos are kept only for a short time and then deleted automatically. You can create a new one anytime.
      </Notice>
    );
  } else if (connectionLost) {
    body = (
      <Notice title="Connection problem" actions={<button type="button" className={primaryBtn} onClick={() => setPollKey((k) => k + 1)}>Try again</button>}>
        We could not reach the server to check your preview.
      </Notice>
    );
  } else if (job?.status === 'FAILED') {
    body = (
      <Notice title="We couldn't create your preview" actions={<>{retry}{chooseAnother}</>}>
        {job.errorMessage || 'Something went wrong. Please try again with a clear, full-body photo.'}
      </Notice>
    );
  } else if (job?.status === 'COMPLETED') {
    const expires = job.expiresAt ? new Date(job.expiresAt) : null;
    body = resultUrl ? (
      <TryOnResult
        resultUrl={resultUrl}
        product={product ?? { name: job.productName, images: [], price: 0 }}
        expiresLabel={expires ? `It will be deleted automatically at ${expires.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : null}
        busy={busy}
        onTryAnother={() => navigate('/virtual-try-on')}
        onViewProduct={() => product && navigate(`/products/${product.slug}`)}
        onAddToCart={handleAddToCart}
        onDelete={handleDelete}
      />
    ) : (
      <div className="mx-auto h-72 max-w-md animate-pulse rounded-2xl bg-[#f0e6d0]" aria-busy="true" aria-label="Loading your preview" />
    );
  } else {
    body = <GenerationProgress productName={job?.productName} onCancel={handleCancel} cancelling={busy} />;
  }

  return (
    <PageShell crumb="Virtual Try-On" title="Your preview" subtitle={job?.productName}>
      {body}
    </PageShell>
  );
}
