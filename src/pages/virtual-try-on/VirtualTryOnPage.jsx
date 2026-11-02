import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as virtualTryOnService from '../../services/virtualTryOnService';
import { useTryOnAvailable } from '../../hooks/useTryOn';
import { useCategories } from '../../hooks/useCatalog';
import { indexById, normalizeProduct } from '../../utils/catalog';
import PageShell, { EmptyPanel } from '../../components/ui/PageShell';
import TryOnProductGrid from '../../components/virtual-try-on/TryOnProductGrid';

export default function VirtualTryOnPage() {
  const available = useTryOnAvailable();
  const categories = useCategories();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (!available) return undefined;
    let active = true;
    virtualTryOnService.getTryOnProducts()
      .then((data) => active && setState({ loading: false, error: null, items: data ?? [] }))
      .catch(() => active && setState({ loading: false, error: 'Could not load products. Please try again.', items: [] }));
    return () => { active = false; };
  }, [available]);

  const items = useMemo(() => {
    const byId = indexById(categories);
    return state.items.map((i) => ({ ...i, product: normalizeProduct(i.product, byId) }));
  }, [state.items, categories]);

  const visible = categoryId ? items.filter((i) => String(i.product.categoryId) === String(categoryId)) : items;

  if (available === false) {
    return (
      <PageShell crumb="Virtual Try-On" title="Virtual Try-On" subtitle="See yourself in our outfits">
        <EmptyPanel
          title="Coming soon"
          description="Virtual Try-On is not available yet. Meanwhile, browse our collection."
          actionLabel="Shop now"
          actionTo="/products"
        />
      </PageShell>
    );
  }

  return (
    <PageShell crumb="Virtual Try-On" title="Virtual Try-On" subtitle="Pick an outfit, add your photo, and see a preview of you wearing it">
      {available === null || state.loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-[#f0e6d0]" />)}
        </div>
      ) : state.error ? (
        <p role="alert" className="text-center text-red-700">{state.error}</p>
      ) : items.length === 0 ? (
        <EmptyPanel title="No outfits ready yet" description="We are preparing our collection for Virtual Try-On. Please check back soon." actionLabel="Shop now" actionTo="/products" />
      ) : (
        <>
          <p className="mb-6 max-w-2xl text-sm text-[#4a4a3f]">
            Previews are AI illustrations. They cannot show exact fit, size or colour. Your photo is used only to create the preview and is deleted automatically.
          </p>
          <TryOnProductGrid
            items={visible}
            categories={categories}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            onSelect={(item) => navigate(`/virtual-try-on/${item.product.id}`)}
          />
        </>
      )}
    </PageShell>
  );
}
