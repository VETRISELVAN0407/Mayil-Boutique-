import { useEffect, useMemo, useRef, useState } from 'react';
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
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const openBtnRef = useRef(null);
  // null = no price filter (full range of the current products).
  const [priceRange, setPriceRange] = useState(null);

  // `category` holds one or more category slugs, comma separated.
  const selectedSlugs = (params.get('category') || '').split(',').filter(Boolean);
  const selectedColours = (params.get('colour') || '').split(',').filter(Boolean);
  const selectedSizes = (params.get('size') || '').split(',').filter(Boolean);
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

  // Each facet's counts ignore its own selection but respect the others, so the numbers stay meaningful.
  const matchesColour = (p) => selectedColours.length === 0 || (p.colours ?? []).some((c) => selectedColours.includes(c));
  const matchesSize = (p) => selectedSizes.length === 0 || (p.sizes ?? []).some((z) => selectedSizes.includes(z));
  const matchesCategory = (p) => selectedSlugs.length === 0 || selectedSlugs.includes(p.categorySlug);

  const categoryCounts = useMemo(() => {
    const counts = {};
    stockAndPriceMatches.filter((p) => matchesColour(p) && matchesSize(p)).forEach((p) => {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAndPriceMatches, params.get('colour'), params.get('size')]);

  const colourCounts = useMemo(() => {
    const counts = {};
    stockAndPriceMatches.filter((p) => matchesCategory(p) && matchesSize(p)).forEach((p) => {
      (p.colours ?? []).forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAndPriceMatches, params.get('category'), params.get('size')]);

  const sizeCounts = useMemo(() => {
    const counts = {};
    stockAndPriceMatches.filter((p) => matchesCategory(p) && matchesColour(p)).forEach((p) => {
      (p.sizes ?? []).forEach((z) => { counts[z] = (counts[z] || 0) + 1; });
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAndPriceMatches, params.get('category'), params.get('colour')]);

  const products = useMemo(() => {
    const matches = stockAndPriceMatches.filter((p) => matchesCategory(p) && matchesColour(p) && matchesSize(p));
    return sortProducts(matches, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockAndPriceMatches, params.get('category'), params.get('colour'), params.get('size'), sortBy]);

  const filtersActive = selectedSlugs.length > 0 || selectedColours.length > 0 || selectedSizes.length > 0 || inStockOnly || priceActive;
  const activeFilterCount = selectedSlugs.length + selectedColours.length + selectedSizes.length + (inStockOnly ? 1 : 0) + (priceActive ? 1 : 0);

  // While the drawer is open: lock page scroll, move focus into it, close on Escape and keep Tab inside.
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const opener = openBtnRef.current;
    // The drawer is still visibility:hidden on the first frame of the slide-in, so focus a moment later.
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 60);

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setFiltersOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll('button, input, select, a[href], [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [filtersOpen]);

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

  function toggleListParam(key, list, value) {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setParam(key, next.join(','));
  }

  function clearFilters() {
    const next = new URLSearchParams(params);
    next.delete('category');
    next.delete('colour');
    next.delete('size');
    next.delete('instock');
    setParams(next);
    setPriceRange(null);
  }

  // Options come from the loaded products; a selected option stays listed even when its count drops to 0.
  const colourOptions = [...new Set([...fetched.flatMap((p) => p.colours ?? []), ...selectedColours])].sort((a, b) => a.localeCompare(b));
  const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'FREE SIZE', 'FREE'];
  const sizeRank = (z) => { const i = SIZE_ORDER.indexOf(z.toUpperCase()); return i === -1 ? SIZE_ORDER.length : i; };
  const sizeOptions = [...new Set([...fetched.flatMap((p) => p.sizes ?? []), ...selectedSizes])].sort(
    (a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b, undefined, { numeric: true }),
  );

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
          <div className="relative z-10 flex w-full items-center gap-3 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setParam('sort', e.target.value)}
                aria-label="Sort products"
                className="w-full cursor-pointer sm:w-[14.875rem] appearance-none rounded-lg border-0 bg-white py-3.5 pl-5 pr-10 font-serif text-[0.9375rem] text-[#10241d] shadow-card focus:outline-none focus:ring-2 focus:ring-[#E3BF72]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>Sort by: {o.label}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10241d" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <button
              ref={openBtnRef}
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-3.5 font-serif text-[0.9375rem] shadow-card"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f3d2e" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0f3d2e] px-1 text-xs text-white">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Applied filters as removable chips, so they stay visible with the drawer closed */}
        {filtersActive && (
          <div className="no-scrollbar -mt-4 mb-5 flex gap-2 overflow-x-auto">
            {selectedSlugs.map((slug) => (
              <button key={slug} onClick={() => toggleCategory(slug)} className="flex-shrink-0 rounded-full bg-[#0f3d2e] px-3 py-1.5 text-sm text-white">
                {categories.find((c) => c.slug === slug)?.name || slug} ✕
              </button>
            ))}
            {selectedColours.map((c) => (
              <button key={`c-${c}`} onClick={() => toggleListParam('colour', selectedColours, c)} className="flex-shrink-0 rounded-full bg-[#0f3d2e] px-3 py-1.5 text-sm text-white">{c} ✕</button>
            ))}
            {selectedSizes.map((z) => (
              <button key={`s-${z}`} onClick={() => toggleListParam('size', selectedSizes, z)} className="flex-shrink-0 rounded-full bg-[#0f3d2e] px-3 py-1.5 text-sm text-white">Size {z} ✕</button>
            ))}
            {inStockOnly && (
              <button onClick={() => setParam('instock', '')} className="flex-shrink-0 rounded-full bg-[#0f3d2e] px-3 py-1.5 text-sm text-white">In Stock ✕</button>
            )}
            {priceActive && (
              <button onClick={() => setPriceRange(null)} className="flex-shrink-0 rounded-full bg-[#0f3d2e] px-3 py-1.5 text-sm text-white">₹{low}–₹{high} ✕</button>
            )}
            <button onClick={clearFilters} className="flex-shrink-0 px-2 py-1.5 text-sm text-brand-sale underline">Clear all</button>
          </div>
        )}

        {/* Backdrop: always mounted so it can fade in and out */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-[350ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none ${
            filtersOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setFiltersOpen(false)}
          aria-hidden="true"
        />

        <div className="flex items-start gap-8">
          {/* Filters: drawer that slides in from the right. Always mounted (hidden via visibility after the
              slide-out finishes) so the closing animation can play and closed controls are not focusable. */}
          <aside
            ref={drawerRef}
            className={`fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-[24rem] flex-col bg-[#faf3e6] shadow-2xl transition-[transform,visibility] duration-[350ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none ${
              filtersOpen ? 'visible translate-x-0' : 'invisible translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            aria-hidden={!filtersOpen}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-5">
              <h2 className="font-serif text-2xl text-[#0f3d2e]">Filters</h2>
              <button ref={closeBtnRef} onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-card">✕</button>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">
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

              {colourOptions.length > 0 && (
                <FilterGroup title="Colour" icon={<path d="M12 3c5 5 7 8 7 11a7 7 0 0 1-14 0c0-3 2-6 7-11z" />}>
                  <ul>
                    {colourOptions.map((c) => (
                      <CheckRow
                        key={c}
                        checked={selectedColours.includes(c)}
                        onChange={() => toggleListParam('colour', selectedColours, c)}
                        label={c}
                        count={colourCounts[c] || 0}
                      />
                    ))}
                  </ul>
                </FilterGroup>
              )}

              {sizeOptions.length > 0 && (
                <FilterGroup title="Size" icon={<path d="M4 8h16v8H4zM8 8v3M12 8v4M16 8v3" />}>
                  <ul>
                    {sizeOptions.map((z) => (
                      <CheckRow
                        key={z}
                        checked={selectedSizes.includes(z)}
                        onChange={() => toggleListParam('size', selectedSizes, z)}
                        label={z}
                        count={sizeCounts[z] || 0}
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

            </div>

            {/* Apply bar: filters already apply live, this shows the result count and closes the drawer */}
            <div className="flex flex-shrink-0 gap-3 border-t border-[#E8E0D3] bg-[#faf3e6] px-5 py-3">
              {filtersActive && (
                <button onClick={clearFilters} className="rounded-lg border border-[#0f3d2e] px-4 py-3 font-serif text-[#0f3d2e]">Clear</button>
              )}
              <button onClick={() => setFiltersOpen(false)} className="flex-1 rounded-lg bg-[#0f3d2e] py-3 font-serif text-white">
                Show {products.length} {products.length === 1 ? 'piece' : 'pieces'}
              </button>
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
