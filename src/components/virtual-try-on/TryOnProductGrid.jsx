import TryOnProductCard from './TryOnProductCard';

/** Category filter chips plus the grid. `categories` are the storefront categories; only ones with items are listed. */
export default function TryOnProductGrid({ items, categories, categoryId, onCategoryChange, onSelect }) {
  const used = new Set(items.map((i) => i.product.categoryId));
  const chips = categories.filter((c) => used.has(c.id));

  return (
    <div>
      {chips.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[{ id: '', name: 'All' }, ...chips].map((c) => {
            const active = String(categoryId ?? '') === String(c.id);
            return (
              <button
                key={c.id || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(c.id)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  active ? 'border-[#0f3d2e] bg-[#0f3d2e] text-[#E3BF72]' : 'border-[#E3BF72] bg-white text-[#0f3d2e] hover:bg-[#fdf8ee]'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <TryOnProductCard key={item.product.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
