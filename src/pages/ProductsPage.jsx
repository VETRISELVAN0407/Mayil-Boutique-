import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog';
import ProductCard from '../components/ui/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import PriceRangeSlider from '../components/ui/PriceRangeSlider';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

function sortProducts(products, sortBy) {
  const sorted = [...products];
  if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sortBy === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  return sorted;
}

function FilterGroup({ title, icon, children }) {
  return (
    <div className="border-b border-[#E8E0D3] py-5 first:pt-1 last:border-b-0 last:pb-1">
      <h3 className="mb-3 flex items-center gap-3 font-serif text-xl text-[#0f3d2e]">
        {icon && (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8a6d2f" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
            {icon}
          </svg>
        )}
        {title}
      </h3>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count }) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 py-1.5 font-serif text-[0.9375rem] text-[#10241d]">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-5 w-5 flex-shrink-0 rounded-[4px] border border-[#8a6d2f]/60 accent-[#0f3d2e]"
        />
        <span className={checked ? 'font-semibold' : ''}>
          {label}
          {count != null && <span> ({count})</span>}
        </span>
      </label>
    </li>
  );
}

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // null = no price filter (full range of the current products).
  const [priceRange, setPriceRange] = useState(null);

  // `category` holds one or more category slugs, comma separated.
  const selectedSlugs = (params.get('category') || '').split(',').filter(Boolean);
  const inStockOnly = params.get('instock') === '1';
  const search = params.get('search') || '';
  const sortBy = params.get('sort') || 'featured';

  const categories = useCategories();
  const activeCat = selectedSlugs.length === 1 ? categories.find((c) => c.slug === selectedSlugs[0]) : null;
  // While category slugs are still resolving, hold off so the unfiltered list never flashes.
  const resolvingCategory = selectedSlugs.length > 0 && categories.length === 0;
  // Everything matching the search is loaded once; category, stock and price narrow it down here
  // so the counts next to each option stay accurate.
  const { products: fetched, loading, error } = useProducts({ search });

  const bounds = useMemo(() => {
    if (fetched.length === 0) return { min: 0, max: 0 };
    const prices = fetched.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [fetched]);

  const [low, high] = priceRange
    ? [Math.max(priceRange[0], bounds.min), Math.min(priceRange[1], bounds.max)]
    : [bounds.min, bounds.max];
  const priceActive = priceRange != null && (low > bounds.min || high < bounds.max);

  const stockAndPriceMatches = useMemo(
    () =>
      fetched.filter(
        (p) => (!inStockOnly || p.stockQuantity > 0) && p.price >= low && p.price <= high,
      ),
    [fetched, inStockOnly, low, high],
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    stockAndPriceMatches.forEach((p) => {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    });
    return counts;
  }, [stockAndPriceMatches]);

  const products = useMemo(() => {
    const matches =
      selectedSlugs.length > 0
        ? stockAndPriceMatches.filter((p) => selectedSlugs.includes(p.categorySlug))
        : stockAndPriceMatches;
    return sortProducts(matches, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAndPriceMatches, params.get('category'), sortBy]);

  const filtersActive = selectedSlugs.length > 0 || inStockOnly || priceActive;

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function toggleCategory(slug) {
    const next = selectedSlugs.includes(slug) ? selectedSlugs.filter((s) => s !== slug) : [...selectedSlugs, slug];
    setParam('category', next.join(','));
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    next.delete('category');
    next.delete('instock');
    setParams(next);
    setPriceRange(null);
  }

  const visibleCategories = categories.filter((c) => categoryCounts[c.slug] > 0 || selectedSlugs.includes(c.slug));

  return (
    <div className="relative overflow-x-clip bg-[#faf3e6] lining-nums">
      {/* peacock feather in the top-right corner */}
      <img
        src="/feather-corner.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 hidden w-[33.75rem] select-none opacity-90 lg:block"
        style={{
          WebkitMaskImage: 'linear-gradient(to left, #000 55%, transparent), linear-gradient(to bottom, #000 70%, transparent)',
          WebkitMaskComposite: 'source-in',
          maskImage: 'linear-gradient(to left, #000 55%, transparent), linear-gradient(to bottom, #000 70%, transparent)',
          maskComposite: 'intersect',
        }}
      />

      <div className="relative mx-auto max-w-[92rem] px-4 pb-16 pt-8 sm:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[#10241d]">
          <Link to="/" aria-label="Home" className="text-[#8a6d2f]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" /></svg>
          </Link>
          <span className="text-brand-secondary">›</span>
          {activeCat ? (
            <>
              <Link to="/products" className="hover:text-peacock-teal">All Products</Link>
              <span className="text-brand-secondary">›</span>
              <span className="font-medium">{activeCat.name}</span>
            </>
          ) : (
            <span className="font-medium">All Products</span>
          )}
        </nav>

        {/* Heading + sort */}
        <div className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="type-page font-serif font-medium text-[#0f3d2e]">
              {activeCat ? activeCat.name : search ? `Search: "${search}"` : 'All Products'}
            </h1>
            {!loading && (
              <div className="mt-2 flex items-center gap-4">
                <p className="font-serif text-base text-[#10241d] sm:text-xl">
                  {products.length} {products.length === 1 ? 'piece' : 'pieces'} to discover
                </p>
                <span className="hidden h-px w-40 bg-gradient-to-r from-[#8a6d2f] to-transparent sm:block" />
              </div>
            )}
            <p className="mt-2 font-serif text-base italic text-[#4a4a3f] sm:mt-3 sm:text-lg">Timeless elegance. Curated for you.</p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setParam('sort', e.target.value)}
                aria-label="Sort products"
                className="w-[14.875rem] cursor-pointer appearance-none rounded-lg border-0 bg-white py-3.5 pl-5 pr-10 font-serif text-[0.9375rem] text-[#10241d] shadow-card focus:outline-none focus:ring-2 focus:ring-[#E3BF72]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>Sort by: {o.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10241d" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <button onClick={() => setFiltersOpen((o) => !o)} className="rounded-lg bg-white px-4 py-3.5 font-serif text-[0.9375rem] shadow-card md:hidden">
              Filters
            </button>
          </div>
        </div>

        <div className="flex items-start gap-8">
          {/* Sidebar filters */}
          <aside className={`no-scrollbar w-[18.125rem] flex-shrink-0 md:sticky md:top-[6.75rem] md:max-h-[calc(100vh-124px)] md:overflow-y-auto md:pb-2 ${filtersOpen ? 'block' : 'hidden md:block'}`}>
            <div className="rounded-2xl bg-[#fdf8ee] p-5 shadow-card ring-1 ring-[#E8E0D3]">
              {filtersActive && (
                <button onClick={clearFilters} className="mb-3 text-xs text-brand-sale hover:underline">
                  Clear all filters
                </button>
              )}

              <FilterGroup title="Availability" icon={<path d="M12 3 3 12l9 9 9-9-9-9zM12 8l4 4-4 4-4-4z" />}>
                <ul>
                  <CheckRow
                    checked={inStockOnly}
                    onChange={() => setParam('instock', inStockOnly ? '' : '1')}
                    label="In Stock"
                    count={fetched.filter((p) => p.stockQuantity > 0).length}
                  />
                </ul>
              </FilterGroup>

              {bounds.max > bounds.min && (
                <FilterGroup title="Price Range" icon={<path d="M7 5h11M7 9h11M7 5c6 0 6 8 0 8l8 7" />}>
                  <PriceRangeSlider min={bounds.min} max={bounds.max} value={[low, high]} onChange={setPriceRange} />
                </FilterGroup>
              )}

              {visibleCategories.length > 0 && (
                <FilterGroup title="Product Type" icon={<path d="M12 8a2 2 0 1 0-2-2M12 8v3l9 6v2H3v-2l9-6" />}>
                  <ul>
                    {visibleCategories.map((c) => (
                      <CheckRow
                        key={c.slug}
                        checked={selectedSlugs.includes(c.slug)}
                        onChange={() => toggleCategory(c.slug)}
                        label={c.name}
                        count={categoryCounts[c.slug] || 0}
                      />
                    ))}
                  </ul>
                </FilterGroup>
              )}

              {search && (
                <FilterGroup title="Search">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-brand-primary">"{search}"</span>
                    <button onClick={() => setParam('search', '')} className="text-xs text-brand-sale hover:underline">Clear</button>
                  </div>
                </FilterGroup>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-[#E3BF72]/60 bg-gradient-to-b from-[#fdf8ee] to-[#f6ecd6] px-6 py-6 text-center">
              <p className="font-serif text-xl italic text-[#4a3f22]">Elegance in Every Drape</p>
              <p className="mt-1 text-[#8a6d2f]" aria-hidden="true">❖</p>
            </div>
          </aside>

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            {loading || resolvingCategory ? (
              <ProductGridSkeleton count={8} />
            ) : error ? (
              <EmptyState icon="⚠️" title="Could not load products" description={error} actionLabel="Try again" actionTo="/products" />
            ) : products.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No products found"
                description="Try adjusting your filters or search term."
                actionLabel="Clear filters"
                actionTo="/products"
                onAction={filtersActive ? clearFilters : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
